import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/app.error.js';
import { timetableService } from './modules.service.js';

export class DashboardService {
  async getStats(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      studentCount,
      teacherCount,
      todayAttendance,
      totalStudentsForAttendance,
      recentActivities,
      upcomingEvents,
      announcements,
      financialSummary,
    ] = await Promise.all([
      prisma.student.count({ where: { schoolId, isActive: true } }),
      prisma.teacher.count({ where: { schoolId, isActive: true } }),
      prisma.attendance.count({
        where: {
          student: { schoolId },
          date: today,
          status: 'PRESENT',
        },
      }),
      prisma.student.count({ where: { schoolId, isActive: true } }),
      prisma.activityLog.findMany({
        where: { user: { schoolId } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
      }),
      prisma.event.findMany({
        where: { schoolId, startDate: { gte: new Date() } },
        take: 5,
        orderBy: { startDate: 'asc' },
      }),
      prisma.announcement.findMany({
        where: { schoolId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
      this.getFinancialStats(schoolId),
    ]);

    const attendanceRate =
      totalStudentsForAttendance > 0
        ? Math.round((todayAttendance / totalStudentsForAttendance) * 100)
        : 0;

    return {
      students: { total: studentCount },
      teachers: { total: teacherCount },
      attendance: {
        present: todayAttendance,
        total: totalStudentsForAttendance,
        rate: attendanceRate,
      },
      finance: financialSummary,
      recentActivities,
      upcomingEvents,
      announcements,
    };
  }

  private async getFinancialStats(schoolId: string) {
    const invoices = await prisma.feeInvoice.findMany({
      where: { student: { schoolId } },
      select: { paidAmount: true, balance: true, totalAmount: true },
    });

    const expenses = await prisma.expense.aggregate({
      where: { schoolId },
      _sum: { amount: true },
    });

    return {
      revenue: invoices.reduce((s, i) => s + Number(i.paidAmount), 0),
      outstanding: invoices.reduce((s, i) => s + Number(i.balance), 0),
      expenses: Number(expenses._sum.amount || 0),
    };
  }

  async getChartData(schoolId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [attendanceByMonth, revenueByMonth, studentsByClass] = await Promise.all([
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          student: { schoolId },
          date: { gte: sixMonthsAgo },
        },
        _count: true,
      }),
      prisma.payment.findMany({
        where: {
          invoice: { student: { schoolId } },
          paidAt: { gte: sixMonthsAgo },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.student.groupBy({
        by: ['classId'],
        where: { schoolId, isActive: true },
        _count: true,
      }),
    ]);

    const classes = await prisma.class.findMany({
      where: { schoolId },
      select: { id: true, name: true, section: true },
    });

    const classMap = Object.fromEntries(
      classes.map((c) => [c.id, `${c.name}${c.section ? ` ${c.section}` : ''}`])
    );

    return {
      attendance: attendanceByMonth,
      revenue: revenueByMonth,
      studentsByClass: studentsByClass.map((s) => ({
        class: classMap[s.classId || ''] || 'Unassigned',
        count: s._count,
      })),
    };
  }

  async getEvents(schoolId: string) {
    return prisma.event.findMany({
      where: { schoolId },
      orderBy: { startDate: 'asc' },
    });
  }

  async createEvent(
    schoolId: string,
    data: {
      title: string;
      description?: string;
      startDate: string;
      endDate?: string;
      location?: string;
      isAllDay?: boolean;
      color?: string;
    }
  ) {
    return prisma.event.create({
      data: {
        schoolId,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        location: data.location,
        isAllDay: data.isAllDay ?? false,
        color: data.color,
      },
    });
  }

  async updateEvent(
    id: string,
    schoolId: string,
    data: Partial<{
      title: string;
      description: string;
      startDate: string;
      endDate: string | null;
      location: string;
      isAllDay: boolean;
      color: string;
    }>
  ) {
    const existing = await prisma.event.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundError('Event');

    return prisma.event.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
      },
    });
  }

  async deleteEvent(id: string, schoolId: string) {
    const existing = await prisma.event.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundError('Event');
    await prisma.event.delete({ where: { id } });
    return { message: 'Event deleted' };
  }
}

export class ParentPortalService {
  async getChildren(parentUserId: string) {
    const parent = await prisma.parent.findUnique({
      where: { userId: parentUserId },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true, avatar: true } },
                class: true,
              },
            },
          },
        },
      },
    });

    if (!parent) throw new NotFoundError('Parent profile');
    return parent.children.map((c) => c.student);
  }

  async getChildAttendance(studentId: string, parentUserId: string) {
    await this.verifyParentAccess(studentId, parentUserId);

    return prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  async getChildResults(studentId: string, parentUserId: string) {
    await this.verifyParentAccess(studentId, parentUserId);

    return prisma.examResult.findMany({
      where: { studentId, exam: { isPublished: true } },
      include: {
        exam: { include: { subject: true, term: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getChildFees(studentId: string, parentUserId: string) {
    await this.verifyParentAccess(studentId, parentUserId);

    return prisma.feeInvoice.findMany({
      where: { studentId },
      include: { payments: true, feeStructure: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  private async verifyParentAccess(studentId: string, parentUserId: string) {
    const parent = await prisma.parent.findUnique({
      where: { userId: parentUserId },
      include: { children: { where: { studentId } } },
    });

    if (!parent || parent.children.length === 0) {
      throw new ForbiddenError('You do not have access to this student');
    }
  }

  async getChildTimetable(studentId: string, parentUserId: string) {
    await this.verifyParentAccess(studentId, parentUserId);
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classId: true } });
    if (!student?.classId) return [];
    return timetableService.getClassTimetable(student.classId);
  }

  async getChildAssignments(studentId: string, parentUserId: string) {
    await this.verifyParentAccess(studentId, parentUserId);
    return studentPortalService.getAssignmentsForStudent(studentId);
  }

  async getChildLibrary(studentId: string, parentUserId: string) {
    await this.verifyParentAccess(studentId, parentUserId);
    return studentPortalService.getLibraryForStudent(studentId);
  }

  async getChildTransport(studentId: string, parentUserId: string) {
    await this.verifyParentAccess(studentId, parentUserId);
    return studentPortalService.getTransportForStudent(studentId);
  }
}

export class StudentPortalService {
  async getStudentByUserId(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatar: true, phone: true } },
        class: true,
      },
    });
    if (!student) throw new NotFoundError('Student profile');
    return student;
  }

  async getProfile(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const [attendanceRecords, examResults, pendingAssignments] = await Promise.all([
      prisma.attendance.findMany({ where: { studentId: student.id }, take: 30 }),
      prisma.examResult.findMany({
        where: { studentId: student.id, exam: { isPublished: true } },
        include: { exam: true },
      }),
      prisma.assignment.count({
        where: {
          classId: student.classId || undefined,
          submissions: { none: { studentId: student.id } },
          dueDate: { gte: new Date() },
        },
      }),
    ]);

    const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRate = attendanceRecords.length
      ? Math.round((presentCount / attendanceRecords.length) * 100)
      : 0;
    const averageScore = examResults.length
      ? Math.round(
          examResults.reduce((sum, r) => sum + (Number(r.marksObtained) / Number(r.exam.totalMarks)) * 100, 0) /
            examResults.length
        )
      : null;

    return {
      ...student,
      stats: { attendanceRate, averageScore, pendingAssignments, examCount: examResults.length },
    };
  }

  async getResults(userId: string) {
    const student = await this.getStudentByUserId(userId);
    return prisma.examResult.findMany({
      where: { studentId: student.id, exam: { isPublished: true } },
      include: { exam: { include: { subject: true, term: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAttendance(userId: string) {
    const student = await this.getStudentByUserId(userId);
    return prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  async getFees(userId: string) {
    const student = await this.getStudentByUserId(userId);
    return prisma.feeInvoice.findMany({
      where: { studentId: student.id },
      include: { payments: true, feeStructure: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getTimetable(userId: string) {
    const student = await this.getStudentByUserId(userId);
    if (!student.classId) return [];
    return timetableService.getClassTimetable(student.classId);
  }

  async getAssignmentsForStudent(studentId: string) {
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true, classId: true } });
    if (!student?.classId) return [];
    return prisma.assignment.findMany({
      where: { classId: student.classId },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        submissions: { where: { studentId: student.id } },
      },
      orderBy: { dueDate: 'desc' },
      take: 20,
    });
  }

  async getAssignments(userId: string) {
    const student = await this.getStudentByUserId(userId);
    return this.getAssignmentsForStudent(student.id);
  }

  async getLibraryForStudent(studentId: string) {
    return prisma.bookBorrowing.findMany({
      where: { studentId },
      include: { book: { select: { title: true, author: true, isbn: true } } },
      orderBy: { borrowedAt: 'desc' },
      take: 20,
    });
  }

  async getLibrary(userId: string) {
    const student = await this.getStudentByUserId(userId);
    return this.getLibraryForStudent(student.id);
  }

  async getTransportForStudent(studentId: string) {
    return prisma.transportAssignment.findUnique({
      where: { studentId },
      include: {
        vehicle: { include: { routes: true } },
      },
    });
  }

  async getTransport(userId: string) {
    const student = await this.getStudentByUserId(userId);
    return this.getTransportForStudent(student.id);
  }

  async getHostel(userId: string) {
    const student = await this.getStudentByUserId(userId);
    return prisma.hostelAssignment.findUnique({
      where: { studentId: student.id },
      include: { room: true },
    });
  }
}

export class AIService {
  generateReportComment(data: {
    studentName: string;
    subject: string;
    marks: number;
    totalMarks: number;
    rank?: number;
    attendance?: number;
  }): string {
    const percentage = Math.round((data.marks / data.totalMarks) * 100);
    let performance: string;

    if (percentage >= 90) performance = 'outstanding';
    else if (percentage >= 80) performance = 'excellent';
    else if (percentage >= 70) performance = 'good';
    else if (percentage >= 60) performance = 'satisfactory';
    else if (percentage >= 50) performance = 'needs improvement';
    else performance = 'requires significant improvement';

    let comment = `${data.studentName} has demonstrated ${performance} performance in ${data.subject} with a score of ${data.marks}/${data.totalMarks} (${percentage}%).`;

    if (data.rank && data.rank <= 3) {
      comment += ` Ranked ${data.rank} in class — commendable achievement.`;
    }

    if (data.attendance !== undefined) {
      if (data.attendance >= 95) comment += ' Excellent attendance record.';
      else if (data.attendance < 80) comment += ' Attendance needs improvement.';
    }

    if (percentage >= 70) {
      comment += ' Keep up the good work and continue striving for excellence.';
    } else {
      comment += ' With consistent effort and support, improvement is achievable.';
    }

    return comment;
  }

  generateLessonPlan(data: {
    subject: string;
    topic: string;
    grade: string;
    duration: number;
  }) {
    return {
      title: `${data.topic} - ${data.subject}`,
      objectives: [
        `Understand the core concepts of ${data.topic}`,
        `Apply knowledge of ${data.topic} to practical scenarios`,
        `Evaluate and analyze ${data.topic} related problems`,
      ],
      introduction: `Begin with a brief review of prior knowledge related to ${data.topic}. Engage students with a thought-provoking question.`,
      mainActivity: `Deliver structured content on ${data.topic} using visual aids and interactive discussions. Duration: ${Math.round(data.duration * 0.6)} minutes.`,
      practice: `Students work on exercises individually and in groups. Duration: ${Math.round(data.duration * 0.25)} minutes.`,
      conclusion: `Summarize key points, address questions, and assign homework on ${data.topic}.`,
      resources: ['Textbook', 'Whiteboard', 'Worksheets', 'Digital presentation'],
      assessment: 'Formative assessment through Q&A and exercise completion.',
      isAiGenerated: true,
    };
  }

  analyzeStudentRisk(data: {
    attendanceRate: number;
    averageScore: number;
    recentTrend: 'improving' | 'declining' | 'stable';
  }) {
    let riskScore = 0;
    const factors: string[] = [];

    if (data.attendanceRate < 75) {
      riskScore += 30;
      factors.push('Low attendance');
    } else if (data.attendanceRate < 85) {
      riskScore += 15;
      factors.push('Below average attendance');
    }

    if (data.averageScore < 40) {
      riskScore += 40;
      factors.push('Failing grades');
    } else if (data.averageScore < 50) {
      riskScore += 25;
      factors.push('Below passing grade');
    }

    if (data.recentTrend === 'declining') {
      riskScore += 20;
      factors.push('Declining performance trend');
    }

    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      riskScore,
      riskLevel,
      factors,
      recommendations: this.getRiskRecommendations(riskLevel, factors),
    };
  }

  private getRiskRecommendations(level: string, factors: string[]) {
    const recommendations: string[] = [];
    if (factors.includes('Low attendance')) {
      recommendations.push('Schedule parent-teacher meeting to discuss attendance');
    }
    if (factors.includes('Failing grades') || factors.includes('Below passing grade')) {
      recommendations.push('Assign peer tutoring or remedial classes');
    }
    if (level === 'high') {
      recommendations.push('Refer to school counselor for academic support plan');
    }
    return recommendations;
  }
}

export const dashboardService = new DashboardService();
export const parentPortalService = new ParentPortalService();
export const studentPortalService = new StudentPortalService();
export const aiService = new AIService();
