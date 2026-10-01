import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError } from '../../shared/errors/app.error.js';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/index.js';

export class TransportService {
  async getVehicles(schoolId: string) {
    return prisma.vehicle.findMany({
      where: { schoolId },
      include: { routes: true, _count: { select: { assignments: true } } },
      orderBy: { registration: 'asc' },
    });
  }

  async createVehicle(
    schoolId: string,
    data: { registration: string; make?: string; model?: string; capacity: number; driverName?: string; driverPhone?: string }
  ) {
    return prisma.vehicle.create({ data: { schoolId, ...data } });
  }

  async createRoute(vehicleId: string, data: { name: string; startPoint: string; endPoint: string; fee?: number }) {
    return prisma.transportRoute.create({ data: { vehicleId, ...data } });
  }

  async getStats(schoolId: string) {
    const [vehicles, assignments] = await Promise.all([
      prisma.vehicle.count({ where: { schoolId, isActive: true } }),
      prisma.transportAssignment.count({ where: { vehicle: { schoolId } } }),
    ]);
    return { vehicles, assignments };
  }

  async getAssignments(schoolId: string) {
    return prisma.transportAssignment.findMany({
      where: { vehicle: { schoolId } },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true, section: true } },
          },
        },
        vehicle: { select: { registration: true, make: true, model: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export class HostelService {
  async getRooms(schoolId: string) {
    return prisma.hostelRoom.findMany({
      where: { schoolId },
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createRoom(schoolId: string, data: { name: string; floor?: number; capacity: number }) {
    return prisma.hostelRoom.create({ data: { schoolId, ...data } });
  }

  async assignStudent(studentId: string, roomId: string, bedNumber?: string) {
    const room = await prisma.hostelRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundError('Room');
    if (room.occupied >= room.capacity) throw new NotFoundError('Room is full');

    return prisma.$transaction(async (tx) => {
      await tx.hostelRoom.update({
        where: { id: roomId },
        data: { occupied: { increment: 1 }, status: room.occupied + 1 >= room.capacity ? 'OCCUPIED' : 'AVAILABLE' },
      });
      return tx.hostelAssignment.create({
        data: { studentId, roomId, bedNumber },
        include: { room: true, student: { include: { user: { select: { firstName: true, lastName: true } } } } },
      });
    });
  }

  async getStats(schoolId: string) {
    const rooms = await prisma.hostelRoom.findMany({ where: { schoolId } });
    return {
      totalRooms: rooms.length,
      totalCapacity: rooms.reduce((s, r) => s + r.capacity, 0),
      occupied: rooms.reduce((s, r) => s + r.occupied, 0),
    };
  }
}

export class HealthService {
  async getVisits(schoolId: string) {
    const students = await prisma.student.findMany({ where: { schoolId }, select: { id: true } });
    const studentIds = students.map((s) => s.id);
    const visits = await prisma.clinicVisit.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { visitDate: 'desc' },
      take: 50,
    });

    const visitStudentIds = [...new Set(visits.map((v) => v.studentId))];
    const studentRecords = await prisma.student.findMany({
      where: { id: { in: visitStudentIds } },
      include: { user: { select: { firstName: true, lastName: true } }, class: { select: { name: true } } },
    });
    const studentMap = Object.fromEntries(studentRecords.map((s) => [s.id, s]));

    return visits.map((v) => ({
      ...v,
      student: studentMap[v.studentId] || null,
    }));
  }

  async recordVisit(data: {
    studentId: string;
    symptoms?: string;
    diagnosis?: string;
    treatment?: string;
    medication?: string;
  }) {
    return prisma.clinicVisit.create({ data });
  }

  async getMedicineInventory(schoolId: string) {
    return prisma.medicineInventory.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }
}

export class HRService {
  async getEmployees(schoolId: string, query: Record<string, unknown>) {
    const { page, limit, search } = getPaginationParams(query);
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: {
          schoolId,
          ...(search && {
            OR: [
              { employeeId: { contains: search } },
              { designation: { contains: search } },
            ],
          }),
        },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      }),
      prisma.employee.count({ where: { schoolId } }),
    ]);
    return buildPaginatedResult(employees, total, page, limit);
  }

  async getLeaveRequests(schoolId: string) {
    return prisma.leaveRequest.findMany({
      where: { user: { schoolId } },
      include: {
        user: { select: { firstName: true, lastName: true } },
        approver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async getStats(schoolId: string) {
    const [employees, pendingLeave, approvedLeave] = await Promise.all([
      prisma.employee.count({ where: { schoolId } }),
      prisma.leaveRequest.count({ where: { user: { schoolId }, status: 'PENDING' } }),
      prisma.leaveRequest.count({ where: { user: { schoolId }, status: 'APPROVED' } }),
    ]);
    return { employees, pendingLeave, approvedLeave };
  }
}

export class InventoryService {
  async getAssets(schoolId: string) {
    return prisma.asset.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }

  async createAsset(
    schoolId: string,
    data: { name: string; category: string; serialNumber?: string; location?: string; purchaseCost?: number }
  ) {
    return prisma.asset.create({ data: { schoolId, ...data } });
  }

  async getSuppliers(schoolId: string) {
    return prisma.supplier.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }
}

export class TimetableService {
  async getClassTimetable(classId: string) {
    const slots = await prisma.timetable.findMany({
      where: { classId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    const subjectIds = [...new Set(slots.map((s) => s.subjectId).filter(Boolean))] as string[];
    const teacherIds = [...new Set(slots.map((s) => s.teacherId).filter(Boolean))] as string[];

    const [subjects, teachers] = await Promise.all([
      subjectIds.length
        ? prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } })
        : [],
      teacherIds.length
        ? prisma.teacher.findMany({
            where: { id: { in: teacherIds } },
            include: { user: { select: { firstName: true, lastName: true } } },
          })
        : [],
    ]);

    const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));
    const teacherMap = Object.fromEntries(
      teachers.map((t) => [t.id, { name: `${t.user.firstName} ${t.user.lastName}`, specialization: t.specialization }])
    );

    return slots.map((slot) => ({
      ...slot,
      subject: slot.subjectId ? subjectMap[slot.subjectId] : null,
      teacher: slot.teacherId ? teacherMap[slot.teacherId] : null,
    }));
  }

  async createSlot(data: {
    classId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subjectId?: string;
    teacherId?: string;
    room?: string;
  }) {
    const conflicts = await prisma.timetable.findMany({
      where: {
        classId: data.classId,
        dayOfWeek: data.dayOfWeek,
        OR: [
          { AND: [{ startTime: { lte: data.startTime } }, { endTime: { gt: data.startTime } }] },
          { AND: [{ startTime: { lt: data.endTime } }, { endTime: { gte: data.endTime } }] },
        ],
      },
    });

    return prisma.timetable.create({
      data: { ...data, ...(conflicts.length > 0 && {}) },
    });
  }
}

export class LearningService {
  async getAssignments(schoolId: string) {
    return prisma.assignment.findMany({
      where: { class: { schoolId } },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: 'desc' },
      take: 30,
    });
  }

  async getAssignmentById(id: string, schoolId: string) {
    const assignment = await prisma.assignment.findFirst({
      where: { id, class: { schoolId } },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
        submissions: {
          include: {
            student: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
    if (!assignment) throw new NotFoundError('Assignment');
    return assignment;
  }

  async getSubmissions(assignmentId: string, schoolId: string) {
    await this.getAssignmentById(assignmentId, schoolId);
    return prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async createAssignment(
    data: {
      classId: string;
      subjectId: string;
      title: string;
      description?: string;
      dueDate: string;
      totalMarks: number;
      createdBy?: string;
    },
    file?: Express.Multer.File
  ) {
    const { storeAssignmentPdf } = await import('../../infrastructure/storage/file-storage.service.js');
    let attachments: { fileName: string; fileUrl: string; mimeType: string } | undefined;
    if (file) {
      const stored = await storeAssignmentPdf(file, 'materials');
      attachments = { fileName: stored.fileName, fileUrl: stored.fileUrl, mimeType: 'application/pdf' };
    }
    return prisma.assignment.create({
      data: {
        ...data,
        dueDate: new Date(data.dueDate),
        attachments,
      },
      include: { class: true, subject: true },
    });
  }

  async submitAssignment(assignmentId: string, userId: string, file: Express.Multer.File) {
    const { storeAssignmentPdf } = await import('../../infrastructure/storage/file-storage.service.js');
    const student = await prisma.student.findFirst({ where: { userId } });
    if (!student?.classId) throw new NotFoundError('Student');

    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, classId: student.classId },
    });
    if (!assignment) throw new NotFoundError('Assignment');

    const { fileUrl, fileName } = await storeAssignmentPdf(file, 'submissions');

    return prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: { assignmentId, studentId: student.id },
      },
      create: {
        assignmentId,
        studentId: student.id,
        fileUrl,
        content: `PDF submission: ${fileName}`,
        submittedAt: new Date(),
      },
      update: {
        fileUrl,
        content: `PDF submission: ${fileName}`,
        submittedAt: new Date(),
        marks: null,
        feedback: null,
        gradedAt: null,
      },
    });
  }

  async gradeSubmission(
    submissionId: string,
    schoolId: string,
    data: { marks?: number; feedback?: string }
  ) {
    const submission = await prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, assignment: { class: { schoolId } } },
    });
    if (!submission) throw new NotFoundError('Submission');

    return prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marks: data.marks,
        feedback: data.feedback,
        gradedAt: new Date(),
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }
}

export const transportService = new TransportService();
export const hostelService = new HostelService();
export const healthService = new HealthService();
export const hrService = new HRService();
export const inventoryService = new InventoryService();
export const timetableService = new TimetableService();
export const learningService = new LearningService();
