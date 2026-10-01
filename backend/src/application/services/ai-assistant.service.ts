import { UserRole } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError, ValidationError } from '../../shared/errors/app.error.js';
import { completeWithLlm, resolveLlmMode, sanitizeError, type ChatTurn, type LlmMode } from '../../infrastructure/ai/llm.client.js';

export type AssistantLanguage = 'en' | 'fr' | 'rw';

const LANGUAGE_NAMES: Record<AssistantLanguage, string> = {
  en: 'English',
  fr: 'French',
  rw: 'Kinyarwanda',
};

const ACADEMIC_ADMIN: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_OWNER,
  UserRole.PRINCIPAL,
  UserRole.VICE_PRINCIPAL,
  UserRole.REGISTRAR,
];

const FINANCE_ROLES: UserRole[] = [UserRole.BURSAR, UserRole.ACCOUNTANT];
const TEACHER_ROLES: UserRole[] = [UserRole.TEACHER, UserRole.CLASS_TEACHER];

type Scope = 'school' | 'finance' | 'classes' | 'self' | 'children' | 'summary';

interface FollowUp {
  name: string;
  className?: string;
  absent: number;
  late: number;
  total: number;
}

interface OpenInvoice {
  name: string;
  className?: string;
  invoiceNumber: string;
  balance: number;
  status: string;
  dueDate: string | null;
}

interface NamedAmount {
  name: string;
  className?: string;
  detail: string;
}

interface Snapshot {
  school: { name: string; currency: string; country: string; city: string | null };
  viewer: { name: string; role: string };
  scope: Scope;
  attendance?: {
    from: string | null;
    to: string | null;
    present: number;
    absent: number;
    late: number;
    other: number;
    rate: number | null;
    followUp: FollowUp[];
  };
  fees?: {
    currency: string;
    collected: number;
    outstanding: number;
    openCount: number;
    openInvoices: OpenInvoice[];
  };
  exams?: {
    published: {
      name: string;
      subject: string;
      className: string;
      average: number | null;
      totalMarks: number;
      belowPass: NamedAmount[];
      kind?: 'score';
    }[];
  };
  timetable?: { day: string; slots: { time: string; subject: string; className: string; room: string | null }[] };
  teachers?: { active: number };
  students?: { active: number; className?: string };
  people?: { name: string; className?: string; admissionNumber?: string }[];
}

function asLanguage(value: unknown): AssistantLanguage {
  if (value === 'fr' || value === 'rw' || value === 'en') return value;
  return 'en';
}

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function classLabel(cls?: { name: string; section: string | null } | null): string {
  if (!cls) return 'Unassigned';
  return `${cls.name}${cls.section ? ` ${cls.section}` : ''}`;
}

function personName(user?: { firstName: string; lastName: string } | null): string {
  if (!user) return 'Unknown';
  return `${user.firstName} ${user.lastName}`.trim();
}

function money(amount: number, currency: string): string {
  return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
}

const DAYS: Record<AssistantLanguage, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  rw: ['Ku cyumweru', 'Ku wa mbere', 'Ku wa kabiri', 'Ku wa gatatu', 'Ku wa kane', 'Ku wa gatanu', 'Ku wa gatandatu'],
};

function dayName(day: number, language: AssistantLanguage): string {
  return DAYS[language][day] || DAYS.en[day] || 'Day';
}

async function loadSchool(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true, currency: true, country: true, city: true },
  });
  if (!school) throw new NotFoundError('School');
  return school;
}

async function attendanceSummary(where: { studentId?: string | { in: string[] }; student?: { schoolId: string } }, followUp: boolean) {
  const latest = await prisma.attendance.findFirst({
    where,
    orderBy: { date: 'desc' },
    select: { date: true },
  });
  if (!latest) {
    return { from: null, to: null, present: 0, absent: 0, late: 0, other: 0, rate: null, followUp: [] as FollowUp[] };
  }
  const since = new Date(latest.date);
  since.setDate(since.getDate() - 14);
  const rows = await prisma.attendance.findMany({
    where: { ...where, date: { gte: since } },
    select: {
      status: true,
      studentId: true,
      student: {
        select: {
          user: { select: { firstName: true, lastName: true } },
          class: { select: { name: true, section: true } },
        },
      },
    },
  });

  let present = 0;
  let absent = 0;
  let late = 0;
  let other = 0;
  const byStudent = new Map<string, { name: string; className: string; absent: number; late: number; total: number }>();

  for (const row of rows) {
    if (row.status === 'PRESENT') present += 1;
    else if (row.status === 'ABSENT') absent += 1;
    else if (row.status === 'LATE') late += 1;
    else other += 1;

    if (!followUp) continue;
    const current = byStudent.get(row.studentId) || {
      name: personName(row.student.user),
      className: classLabel(row.student.class),
      absent: 0,
      late: 0,
      total: 0,
    };
    current.total += 1;
    if (row.status === 'ABSENT') current.absent += 1;
    if (row.status === 'LATE') current.late += 1;
    byStudent.set(row.studentId, current);
  }

  const marked = present + absent + late + other;
  const followUps = followUp
    ? [...byStudent.values()]
        .filter((item) => item.total > 0 && (item.absent + item.late) / item.total >= 0.25)
        .sort((a, b) => b.absent + b.late - (a.absent + a.late))
        .slice(0, 8)
        .map((item) => ({
          name: item.name,
          className: item.className,
          absent: item.absent,
          late: item.late,
          total: item.total,
        }))
    : [];

  return {
    from: since.toISOString().slice(0, 10),
    to: latest.date.toISOString().slice(0, 10),
    present,
    absent,
    late,
    other,
    rate: marked > 0 ? Math.round((present / marked) * 100) : null,
    followUp: followUps,
  };
}

async function feeSummary(studentIds: string[] | null, schoolId: string, currency: string, includeNames: boolean) {
  const invoices = await prisma.feeInvoice.findMany({
    where: studentIds ? { studentId: { in: studentIds } } : { student: { schoolId } },
    select: {
      invoiceNumber: true,
      status: true,
      paidAmount: true,
      balance: true,
      dueDate: true,
      student: {
        select: {
          user: { select: { firstName: true, lastName: true } },
          class: { select: { name: true, section: true } },
        },
      },
    },
  });

  const open = invoices.filter((invoice) => num(invoice.balance) > 0 && invoice.status !== 'CANCELLED' && invoice.status !== 'PAID');
  open.sort((a, b) => num(b.balance) - num(a.balance));

  return {
    currency,
    collected: invoices.reduce((sum, invoice) => sum + num(invoice.paidAmount), 0),
    outstanding: open.reduce((sum, invoice) => sum + num(invoice.balance), 0),
    openCount: open.length,
    openInvoices: open.slice(0, 8).map((invoice) => ({
      name: includeNames ? personName(invoice.student.user) : '',
      className: includeNames ? classLabel(invoice.student.class) : undefined,
      invoiceNumber: invoice.invoiceNumber,
      balance: num(invoice.balance),
      status: invoice.status,
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : null,
    })),
  };
}

async function examSummary(where: { classId?: { in: string[] } | string; id?: string }, includeNames: boolean) {
  const exams = await prisma.exam.findMany({
    where: { ...where, isPublished: true },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true, section: true } },
      results: {
        select: {
          marksObtained: true,
          grade: true,
          student: { select: { user: { select: { firstName: true, lastName: true } } } },
        },
      },
    },
  });

  return {
    published: exams.map((exam) => {
      const total = num(exam.totalMarks);
      const pass = num(exam.passMarks);
      const marks = exam.results.map((result) => num(result.marksObtained));
      const average = marks.length ? Math.round(marks.reduce((sum, mark) => sum + mark, 0) / marks.length) : null;
      const below = exam.results
        .filter((result) => num(result.marksObtained) < pass)
        .slice(0, 6)
        .map((result) => ({
          name: includeNames ? personName(result.student.user) : 'Student',
          detail: `${num(result.marksObtained)}/${total}${result.grade ? ` (${result.grade})` : ''}`,
        }));
      return {
        name: exam.name,
        subject: exam.subject.name,
        className: classLabel(exam.class),
        average,
        totalMarks: total,
        belowPass: includeNames ? below : below.map((item) => ({ name: 'Learner', detail: item.detail })),
      };
    }),
  };
}

async function personalExams(studentId: string) {
  const results = await prisma.examResult.findMany({
    where: { studentId, exam: { isPublished: true } },
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      exam: {
        select: {
          name: true,
          totalMarks: true,
          passMarks: true,
          subject: { select: { name: true } },
          class: { select: { name: true, section: true } },
        },
      },
    },
  });

  return {
    published: results.map((result) => ({
      name: result.exam.name,
      subject: result.exam.subject.name,
      className: classLabel(result.exam.class),
        average: num(result.marksObtained),
        totalMarks: num(result.exam.totalMarks),
        kind: 'score' as const,
        belowPass:
        num(result.marksObtained) < num(result.exam.passMarks)
          ? [{ name: '—', detail: `${num(result.marksObtained)}/${num(result.exam.totalMarks)}` }]
          : [],
    })),
  };
}

async function timetableForClasses(classIds: string[], language: AssistantLanguage): Promise<NonNullable<Snapshot['timetable']>> {
  const today = new Date().getDay();
  if (!classIds.length || today === 0 || today === 6) {
    return { day: dayName(today, language), slots: [] };
  }

  const slots = await prisma.timetable.findMany({
    where: { classId: { in: classIds }, dayOfWeek: today },
    orderBy: [{ startTime: 'asc' }],
    include: { class: { select: { name: true, section: true } } },
  });
  const subjectIds = [...new Set(slots.map((slot) => slot.subjectId).filter((id): id is string => Boolean(id)))];
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true, name: true },
  });
  const subjectName = Object.fromEntries(subjects.map((subject) => [subject.id, subject.name]));

  return {
    day: dayName(today, language),
    slots: slots.slice(0, 40).map((slot) => ({
      time: `${slot.startTime}–${slot.endTime}`,
      subject: slot.subjectId ? subjectName[slot.subjectId] || 'Subject' : 'Subject',
      className: classLabel(slot.class),
      room: slot.room,
    })),
  };
}

async function buildSnapshot(userId: string, role: UserRole, schoolId: string, language: AssistantLanguage): Promise<Snapshot> {
  const [school, user] = await Promise.all([
    loadSchool(schoolId),
    prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } }),
  ]);

  const base: Snapshot = {
    school: { name: school.name, currency: school.currency, country: school.country, city: school.city },
    viewer: { name: personName(user), role },
    scope: 'summary',
  };

  if (ACADEMIC_ADMIN.includes(role)) {
    const [students, teachers, attendance, fees, classes] = await Promise.all([
      prisma.student.count({ where: { schoolId, isActive: true } }),
      prisma.teacher.count({ where: { schoolId, isActive: true } }),
      attendanceSummary({ student: { schoolId } }, true),
      feeSummary(null, schoolId, school.currency, true),
      prisma.class.findMany({ where: { schoolId }, select: { id: true } }),
    ]);
    const classIds = classes.map((item) => item.id);
    const [exams, timetable] = await Promise.all([
      examSummary({ classId: { in: classIds } }, true),
      timetableForClasses(classIds, language),
    ]);
    return {
      ...base,
      scope: 'school',
      students: { active: students },
      teachers: { active: teachers },
      attendance,
      fees,
      exams,
      timetable,
    };
  }

  if (FINANCE_ROLES.includes(role)) {
    return {
      ...base,
      scope: 'finance',
      fees: await feeSummary(null, schoolId, school.currency, true),
    };
  }

  if (TEACHER_ROLES.includes(role)) {
    const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    const slots = teacher
      ? await prisma.timetable.findMany({
          where: { teacherId: teacher.id, class: { schoolId } },
          select: { classId: true },
        })
      : [];
    const classIds = [...new Set(slots.map((slot) => slot.classId))];
    const students = classIds.length
      ? await prisma.student.findMany({
          where: { schoolId, classId: { in: classIds }, isActive: true },
          select: { id: true },
        })
      : [];
    const studentIds = students.map((student) => student.id);
    return {
      ...base,
      scope: 'classes',
      students: { active: studentIds.length },
      attendance: studentIds.length ? await attendanceSummary({ studentId: { in: studentIds } }, true) : undefined,
      exams: classIds.length ? await examSummary({ classId: { in: classIds } }, true) : { published: [] },
      timetable: await timetableForClasses(classIds, language),
    };
  }

  if (role === UserRole.STUDENT) {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        id: true,
        admissionNumber: true,
        classId: true,
        class: { select: { name: true, section: true } },
      },
    });
    if (!student || !student.classId) {
      return { ...base, scope: 'self', people: [{ name: base.viewer.name }] };
    }
    return {
      ...base,
      scope: 'self',
      students: { active: 1, className: classLabel(student.class) },
      people: [{ name: base.viewer.name, className: classLabel(student.class), admissionNumber: student.admissionNumber }],
      attendance: await attendanceSummary({ studentId: student.id }, false),
      fees: await feeSummary([student.id], schoolId, school.currency, false),
      exams: await personalExams(student.id),
      timetable: await timetableForClasses([student.classId], language),
    };
  }

  if (role === UserRole.PARENT) {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        children: {
          include: {
            student: {
              select: {
                id: true,
                classId: true,
                admissionNumber: true,
                user: { select: { firstName: true, lastName: true } },
                class: { select: { name: true, section: true } },
              },
            },
          },
        },
      },
    });
    const children = parent?.children.map((link) => link.student) || [];
    const studentIds = children.map((child) => child.id);
    const classIds = [...new Set(children.map((child) => child.classId).filter((id): id is string => Boolean(id)))];
    return {
      ...base,
      scope: 'children',
      people: children.map((child) => ({
        name: personName(child.user),
        className: classLabel(child.class),
        admissionNumber: child.admissionNumber,
      })),
      attendance: studentIds.length ? await attendanceSummary({ studentId: { in: studentIds } }, true) : undefined,
      fees: studentIds.length ? await feeSummary(studentIds, schoolId, school.currency, true) : undefined,
      exams: studentIds.length ? await personalExamsForMany(studentIds) : { published: [] },
      timetable: await timetableForClasses(classIds, language),
    };
  }

  const [students, teachers, attendance] = await Promise.all([
    prisma.student.count({ where: { schoolId, isActive: true } }),
    prisma.teacher.count({ where: { schoolId, isActive: true } }),
    attendanceSummary({ student: { schoolId } }, false),
  ]);

  return {
    ...base,
    scope: 'summary',
    students: { active: students },
    teachers: { active: teachers },
    attendance: { ...attendance, followUp: [] },
  };
}

async function personalExamsForMany(studentIds: string[]) {
  const results = await prisma.examResult.findMany({
    where: { studentId: { in: studentIds }, exam: { isPublished: true } },
    take: 12,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { user: { select: { firstName: true, lastName: true } } } },
      exam: {
        select: {
          name: true,
          totalMarks: true,
          passMarks: true,
          subject: { select: { name: true } },
          class: { select: { name: true, section: true } },
        },
      },
    },
  });

  const grouped = new Map<string, { name: string; subject: string; className: string; marks: number[]; totalMarks: number; belowPass: NamedAmount[] }>();
  for (const result of results) {
    const key = result.examId;
    const current = grouped.get(key) || {
      name: result.exam.name,
      subject: result.exam.subject.name,
      className: classLabel(result.exam.class),
      marks: [],
      totalMarks: num(result.exam.totalMarks),
      belowPass: [],
    };
    const score = num(result.marksObtained);
    current.marks.push(score);
    if (score < num(result.exam.passMarks)) {
      current.belowPass.push({
        name: personName(result.student.user),
        detail: `${score}/${current.totalMarks}`,
      });
    }
    grouped.set(key, current);
  }

  return {
    published: [...grouped.values()].map((exam) => ({
      name: exam.name,
      subject: exam.subject,
      className: exam.className,
      average: exam.marks.length ? Math.round(exam.marks.reduce((sum, mark) => sum + mark, 0) / exam.marks.length) : null,
      totalMarks: exam.totalMarks,
      belowPass: exam.belowPass.slice(0, 6),
    })),
  };
}

const COPY: Record<AssistantLanguage, {
  intro: string;
  scope: Record<Scope, string>;
  attendance: string;
  fees: string;
  exams: string;
  timetable: string;
  people: string;
  counts: string;
  none: string;
  feesClear: string;
  actions: string;
  ask: string;
  followAttendance: string;
  followFees: string;
  followExams: string;
  followTimetable: string;
  weekend: string;
  fallback: string;
  liveFailed: string;
}> = {
  en: {
    intro: 'Here is what the school records show for your account.',
    scope: {
      school: 'You are seeing school-wide operations data.',
      finance: 'You are seeing fee records for this school. Academic marks are not included for this role.',
      classes: 'You are seeing students, attendance, exams, and the timetable for classes on your schedule.',
      self: 'You are seeing only your own attendance, fees, published results, and timetable.',
      children: 'You are seeing only the children linked to your parent account.',
      summary: 'You are seeing school totals only. Individual fees, marks, and student names are hidden for this role.',
    },
    attendance: 'Attendance',
    fees: 'Fees',
    exams: 'Published exams',
    timetable: 'Timetable',
    people: 'People in scope',
    counts: 'School size',
    none: 'No records in this area yet.',
    feesClear: 'No open balances.',
    actions: 'Suggested actions',
    ask: 'Ask about attendance, fees, exams, teachers, or today’s timetable.',
    followAttendance: 'Follow up with learners who were absent or late.',
    followFees: 'Send a fee reminder for open balances before the next term deadline.',
    followExams: 'Review published results and plan support for scores below the pass mark.',
    followTimetable: 'Check today’s periods so classes and rooms are ready.',
    weekend: 'No classes are scheduled today (weekend).',
    fallback: 'This answer used the built-in school-data assistant because no live model is configured. Add OPENAI_API_KEY or GEMINI_API_KEY to backend/.env and restart the API. See backend/.env.example.',
    liveFailed: 'The live model did not respond, so this answer used school records directly.',
  },
  fr: {
    intro: 'Voici ce que les dossiers de l’école montrent pour votre compte.',
    scope: {
      school: 'Vous voyez les données de fonctionnement de toute l’école.',
      finance: 'Vous voyez les frais de cette école. Les notes ne sont pas incluses pour ce rôle.',
      classes: 'Vous voyez les élèves, présences, examens et l’emploi du temps de vos classes.',
      self: 'Vous voyez seulement votre présence, vos frais, vos résultats publiés et votre emploi du temps.',
      children: 'Vous voyez seulement les enfants liés à votre compte parent.',
      summary: 'Vous voyez seulement les totaux de l’école. Les frais, notes et noms individuels sont masqués pour ce rôle.',
    },
    attendance: 'Présences',
    fees: 'Frais',
    exams: 'Examens publiés',
    timetable: 'Emploi du temps',
    people: 'Personnes concernées',
    counts: 'Taille de l’école',
    none: 'Aucun dossier dans cette rubrique pour le moment.',
    feesClear: 'Aucun solde ouvert.',
    actions: 'Actions suggérées',
    ask: 'Posez une question sur les présences, les frais, les examens, les enseignants ou l’emploi du temps.',
    followAttendance: 'Contacter les élèves souvent absents ou en retard.',
    followFees: 'Envoyer un rappel pour les soldes encore ouverts.',
    followExams: 'Revoir les résultats publiés et aider les notes sous la moyenne de passage.',
    followTimetable: 'Vérifier les périodes du jour, les classes et les salles.',
    weekend: 'Aucun cours aujourd’hui (week-end).',
    fallback: 'Cette réponse utilise l’assistant local, car aucun modèle en ligne n’est configuré. Ajoutez OPENAI_API_KEY ou GEMINI_API_KEY dans backend/.env, puis redémarrez l’API. Voir backend/.env.example.',
    liveFailed: 'Le modèle en ligne n’a pas répondu. Cette réponse s’appuie donc directement sur les dossiers de l’école.',
  },
  rw: {
    intro: 'Dore ibyo inyandiko z’ishuri zigaragaza ku konti yawe.',
    scope: {
      school: 'Urebeye amakuru y’imikorere y’ishuri ryose.',
      finance: 'Urebeye amafaranga y’ishuri. Amanota y’ibizamini ntabwo agaragara kuri uru ruhare.',
      classes: 'Urebeye abanyeshuri, kwitabira, ibizamini, n’igahunda y’amasomo yawe.',
      self: 'Urebeye gusa kwitabira kwawe, amafaranga, amanota yasohotse, n’igahunda yawe.',
      children: 'Urebeye gusa abana bafatanyije na konti yawe y’umubyeyi.',
      summary: 'Urebeye imibare y’ishuri gusa. Amafaranga, amanota, n’amazina y’umuntu ku giti cye birabitswe kuri uru ruhare.',
    },
    attendance: 'Kwitabira',
    fees: 'Amafaranga',
    exams: 'Ibizamini byasohotse',
    timetable: 'Gahunda y’amasomo',
    people: 'Abantu ibi bikubiyeho',
    counts: 'Ingano y’ishuri',
    none: 'Nta makuru ahari muri iki gice.',
    feesClear: 'Nta mafaranga asigaye.',
    actions: 'Ibyo wakora',
    ask: 'Baza ku kwitabira, amafaranga, ibizamini, abarimu, cyangwa gahunda y’uyu munsi.',
    followAttendance: 'Kurikirana abanyeshuri basibye cyangwa batinze.',
    followFees: 'Wohereze urwibutso rw’amafaranga atarishyurwa.',
    followExams: 'Reba amanota yasohotse, ugafasha abari munsi y’amanota yo gutsinda.',
    followTimetable: 'Reba amasaha y’uyu munsi, amasomo, n’ibyumba.',
    weekend: 'Nta masomo ateganyijwe uyu munsi (impera y’icyumweru).',
    fallback: 'Igisubizo gikoresha umufasha w’amakuru y’ishuri kuko nta modeli ya AI yashyizweho. Ongeraho OPENAI_API_KEY cyangwa GEMINI_API_KEY muri backend/.env, hanyuma utangire API. Reba backend/.env.example.',
    liveFailed: 'Modeli ya AI ntiyashoboye gusubiza, none ibisubizo bishingiye ku nyandiko z’ishuri.',
  },
};

const ATTENDANCE_WORDS: Record<AssistantLanguage, { present: string; absent: string; late: string }> = {
  en: { present: 'present', absent: 'absent', late: 'late' },
  fr: { present: 'présents', absent: 'absents', late: 'en retard' },
  rw: { present: 'bitabiriye', absent: 'basibye', late: 'batinze' },
};

function invoiceStatusLabel(status: string, language: AssistantLanguage): string {
  const labels: Record<AssistantLanguage, Record<string, string>> = {
    en: { SENT: 'sent', PARTIAL: 'partial', OVERDUE: 'overdue', PAID: 'paid', DRAFT: 'draft', CANCELLED: 'cancelled' },
    fr: { SENT: 'envoyée', PARTIAL: 'partielle', OVERDUE: 'en retard', PAID: 'payée', DRAFT: 'brouillon', CANCELLED: 'annulée' },
    rw: { SENT: 'yoherejwe', PARTIAL: 'yishyuwe igice', OVERDUE: 'yarengeje igihe', PAID: 'yishyuwe', DRAFT: 'inyandiko', CANCELLED: 'yahagaritswe' },
  };
  return labels[language][status] || status;
}

function wants(question: string, words: string[]): boolean {
  const text = question.toLowerCase();
  return words.some((word) => text.includes(word));
}

function selectedTopics(question: string): Array<'attendance' | 'fees' | 'exams' | 'timetable' | 'people' | 'counts'> {
  const topics: Array<'attendance' | 'fees' | 'exams' | 'timetable' | 'people' | 'counts'> = [];
  if (wants(question, ['attendance', 'absent', 'present', 'late', 'présence', 'presence', 'retard', 'kwitabira', 'abitabiriye', 'yasibye', 'yatinze'])) topics.push('attendance');
  if (wants(question, ['fee', 'fees', 'invoice', 'payment', 'balance', 'outstanding', 'frais', 'facture', 'paiement', 'amafaranga', 'fagitire', 'kwishyura', 'ishyura'])) topics.push('fees');
  if (wants(question, ['exam', 'mark', 'grade', 'result', 'score', 'examen', 'note', 'résultat', 'resultat', 'ikizamini', 'amanota', 'ibizamini'])) topics.push('exams');
  if (wants(question, ['timetable', 'schedule', 'period', 'emploi', 'horaire', 'gahunda', 'isaha', 'amasomo'])) topics.push('timetable');
  if (wants(question, ['teacher', 'staff', 'enseignant', 'professeur', 'umwarimu', 'abarimu', 'student', 'élève', 'eleve', 'umunyeshuri', 'abanyeshuri'])) topics.push('people', 'counts');
  if (wants(question, ['summary', 'overview', 'brief', 'help', 'résumé', 'resume', 'incamake', 'ubufasha', 'ishuri'])) {
    return ['counts', 'attendance', 'fees', 'exams', 'timetable', 'people'];
  }
  return topics;
}

function linesFor(snapshot: Snapshot, language: AssistantLanguage, question: string, note?: string): string {
  const text = COPY[language];
  const topics = selectedTopics(question);
  const showAll = topics.length === 0;
  const show = (topic: (typeof topics)[number]) => showAll || topics.includes(topic);
  const blocks: string[] = [text.intro, text.scope[snapshot.scope], ''];

  if (show('counts') && (snapshot.students || snapshot.teachers)) {
    blocks.push(text.counts);
    if (snapshot.students) blocks.push(`- ${language === 'rw' ? 'Abanyeshuri' : language === 'fr' ? 'Élèves' : 'Students'}: ${snapshot.students.active}${snapshot.students.className ? ` (${snapshot.students.className})` : ''}`);
    if (snapshot.teachers) blocks.push(`- ${language === 'rw' ? 'Abarimu' : language === 'fr' ? 'Enseignants' : 'Teachers'}: ${snapshot.teachers.active}`);
    blocks.push('');
  }

  if (show('people') && snapshot.people?.length) {
    blocks.push(text.people);
    snapshot.people.slice(0, 8).forEach((person) => {
      blocks.push(`- ${person.name}${person.className ? ` · ${person.className}` : ''}${person.admissionNumber ? ` · ${person.admissionNumber}` : ''}`);
    });
    blocks.push('');
  }

    if (show('attendance') && snapshot.attendance) {
    const attendance = snapshot.attendance;
    const range = attendance.from && attendance.to ? ` (${attendance.from} – ${attendance.to})` : '';
    blocks.push(`${text.attendance}${range}`);
    if (attendance.rate === null) blocks.push(`- ${text.none}`);
    else {
      const words = ATTENDANCE_WORDS[language];
      blocks.push(`- ${attendance.present} ${words.present}, ${attendance.absent} ${words.absent}, ${attendance.late} ${words.late} (${attendance.rate}%)`);
      attendance.followUp.forEach((item) => {
        blocks.push(`- ${item.name}${item.className ? ` (${item.className})` : ''}: ${item.absent} ${words.absent}, ${item.late} ${words.late} / ${item.total}`);
      });
    }
    blocks.push('');
  }

  if (show('fees') && snapshot.fees) {
    blocks.push(text.fees);
    blocks.push(`- ${language === 'rw' ? 'Byishyuwe' : language === 'fr' ? 'Payé' : 'Collected'}: ${money(snapshot.fees.collected, snapshot.fees.currency)}`);
    blocks.push(`- ${language === 'rw' ? 'Asigaye' : language === 'fr' ? 'Reste à payer' : 'Outstanding'}: ${money(snapshot.fees.outstanding, snapshot.fees.currency)} (${snapshot.fees.openCount})`);
    if (!snapshot.fees.openInvoices.length) {
      blocks.push(`- ${snapshot.fees.collected === 0 ? text.none : text.feesClear}`);
    }
    snapshot.fees.openInvoices.forEach((item) => {
      const status = invoiceStatusLabel(item.status, language);
      const due = item.dueDate ? ` · ${item.dueDate}` : '';
      const who = item.name ? `${item.name}${item.className ? ` (${item.className})` : ''}: ` : '';
      blocks.push(`- ${who}${item.invoiceNumber} · ${money(item.balance, snapshot.fees!.currency)} · ${status}${due}`);
    });
    blocks.push('');
  }

  if (show('exams') && snapshot.exams) {
    blocks.push(text.exams);
    if (!snapshot.exams.published.length) blocks.push(`- ${text.none}`);
    snapshot.exams.published.forEach((exam) => {
      const average = exam.average === null ? '—' : `${exam.average}/${exam.totalMarks}`;
      const scoreLabel = exam.kind === 'score'
        ? (language === 'rw' ? 'amanota' : language === 'fr' ? 'note' : 'score')
        : (language === 'rw' ? 'impuzandengo' : language === 'fr' ? 'moyenne' : 'average');
      blocks.push(`- ${exam.name} · ${exam.subject} · ${exam.className} · ${scoreLabel} ${average}`);
      exam.belowPass.forEach((item) => blocks.push(`  - ${item.name}: ${item.detail}`));
    });
    blocks.push('');
  }

  if (show('timetable') && snapshot.timetable) {
    blocks.push(`${text.timetable} · ${snapshot.timetable.day}`);
    if (!snapshot.timetable.slots.length) blocks.push(`- ${new Date().getDay() === 0 || new Date().getDay() === 6 ? text.weekend : text.none}`);
    snapshot.timetable.slots.forEach((slot) => blocks.push(`- ${slot.time} · ${slot.subject} · ${slot.className}${slot.room ? ` · ${slot.room}` : ''}`));
    blocks.push('');
  }

  const actions: string[] = [];
  if (snapshot.attendance && snapshot.attendance.followUp.length) actions.push(text.followAttendance);
  if (snapshot.fees && snapshot.fees.outstanding > 0) actions.push(text.followFees);
  if (snapshot.exams && snapshot.exams.published.some((exam) => exam.belowPass.length)) actions.push(text.followExams);
  if (snapshot.timetable) actions.push(text.followTimetable);
  if (!actions.length) actions.push(text.ask);

  blocks.push(text.actions);
  actions.slice(0, 3).forEach((action) => blocks.push(`- ${action}`));

  if (note) {
    blocks.push('');
    blocks.push(note);
  }

  return blocks.join('\n').trim();
}

function systemPrompt(language: AssistantLanguage, snapshot: Snapshot): string {
  return [
    `You are the school operations assistant for ${snapshot.school.name} in ${snapshot.school.city || 'Rwanda'}, ${snapshot.school.country}.`,
    `Reply only in ${LANGUAGE_NAMES[language]}.`,
    'Use only the JSON snapshot. Do not invent students, marks, balances, or timetable slots.',
    'If the snapshot does not contain the answer, say that clearly.',
    'Do not reveal records outside this snapshot. Do not include medical information, passwords, or contact details.',
    `Currency is ${snapshot.school.currency}.`,
    'Give a short answer, then up to three practical next steps for this user.',
    'Snapshot:',
    JSON.stringify(snapshot),
  ].join('\n');
}

const conversationInclude = {
  messages: { orderBy: { createdAt: 'asc' as const } },
};

export class AiAssistantService {
  status() {
    const resolved = resolveLlmMode();
    return {
      mode: resolved.mode,
      model: resolved.model,
      liveModelConfigured: resolved.mode !== 'fallback',
      languages: ['en', 'fr', 'rw'],
    };
  }

  async listConversations(userId: string, schoolId: string) {
    return prisma.aiConversation.findMany({
      where: { userId, schoolId },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: {
        id: true,
        title: true,
        language: true,
        updatedAt: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, role: true } },
      },
    });
  }

  async createConversation(userId: string, schoolId: string, languageInput?: unknown) {
    const language = asLanguage(languageInput);
    return prisma.aiConversation.create({
      data: { userId, schoolId, language, title: 'New chat' },
      include: conversationInclude,
    });
  }

  async getConversation(userId: string, schoolId: string, id: string) {
    const conversation = await prisma.aiConversation.findFirst({
      where: { id, userId, schoolId },
      include: conversationInclude,
    });
    if (!conversation) throw new NotFoundError('Conversation');
    return conversation;
  }

  async deleteConversation(userId: string, schoolId: string, id: string) {
    const conversation = await prisma.aiConversation.findFirst({ where: { id, userId, schoolId }, select: { id: true } });
    if (!conversation) throw new NotFoundError('Conversation');
    await prisma.aiConversation.delete({ where: { id: conversation.id } });
  }

  async sendMessage(userId: string, role: UserRole, schoolId: string, id: string, content: string, languageInput?: string) {
    const trimmed = content.trim();
    if (!trimmed) throw new ValidationError('Message is required');
    if (trimmed.length > 4000) throw new ValidationError('Message is too long');

    const conversation = await this.getConversation(userId, schoolId, id);
    const language = asLanguage(languageInput || conversation.language);
    const title = conversation.messages.length === 0 ? trimmed.slice(0, 72) : conversation.title;

    await prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: trimmed },
    });

    const history = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
    const turns: ChatTurn[] = history.slice(-12).map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }));

    const snapshot = await buildSnapshot(userId, role, schoolId, language);
    let reply = '';
    let provider: LlmMode = 'fallback';

    try {
      const live = await completeWithLlm(systemPrompt(language, snapshot), turns);
      reply = live.text;
      provider = live.mode;
    } catch (error) {
      const reason = sanitizeError(error);
      const note = reason === 'NO_LIVE_MODEL' ? COPY[language].fallback : COPY[language].liveFailed;
      reply = linesFor(snapshot, language, trimmed, note);
      provider = 'fallback';
    }

    await prisma.$transaction([
      prisma.aiMessage.create({
        data: { conversationId: conversation.id, role: 'assistant', content: reply, provider },
      }),
      prisma.aiConversation.update({
        where: { id: conversation.id },
        data: { title, language },
      }),
    ]);

    return this.getConversation(userId, schoolId, conversation.id);
  }
}

export const aiAssistantService = new AiAssistantService();
