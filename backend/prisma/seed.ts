import bcrypt from 'bcryptjs';
import { UserRole, PrismaClient, LeaveStatus, NotificationType, NotificationChannel, AssetStatus, RoomStatus, MessageStatus } from '@prisma/client';

const prisma = new PrismaClient();

const PASSWORD = 'Admin@123';

/** Demo school owner — receives email OTP when SMTP is configured in backend/.env */
const PROJECT_OWNER_EMAIL = 'ishimwehervin10@gmail.com';

const KINYARWANDA_STUDENTS = [
  { firstName: 'Jean Baptiste', lastName: 'Niyonsaba', gender: 'MALE' as const },
  { firstName: 'Marie Grace', lastName: 'Uwimana', gender: 'FEMALE' as const },
  { firstName: 'Emmanuel', lastName: 'Habimana', gender: 'MALE' as const },
  { firstName: 'Chantal', lastName: 'Mukamana', gender: 'FEMALE' as const },
  { firstName: 'Patrick', lastName: 'Bizimana', gender: 'MALE' as const },
  { firstName: 'Immaculée', lastName: 'Nyirahabimana', gender: 'FEMALE' as const },
  { firstName: 'Eric', lastName: 'Rukundo', gender: 'MALE' as const },
  { firstName: 'Vestine', lastName: 'Mutesi', gender: 'FEMALE' as const },
  { firstName: 'Fabrice', lastName: 'Nkurunziza', gender: 'MALE' as const },
  { firstName: 'Consolee', lastName: 'Karimba', gender: 'FEMALE' as const },
  { firstName: 'Innocent', lastName: 'Gasana', gender: 'MALE' as const },
  { firstName: 'Delphine', lastName: 'Uwineza', gender: 'FEMALE' as const },
  { firstName: 'Théophile', lastName: 'Mugisha', gender: 'MALE' as const },
  { firstName: 'Sandrine', lastName: 'Iradukunda', gender: 'FEMALE' as const },
  { firstName: 'Valens', lastName: 'Nshimiyimana', gender: 'MALE' as const },
  { firstName: 'Alice', lastName: 'Nyinawumuntu', gender: 'FEMALE' as const },
  { firstName: 'Bosco', lastName: 'Hategekimana', gender: 'MALE' as const },
  { firstName: 'Yvonne', lastName: 'Mujawamariya', gender: 'FEMALE' as const },
  { firstName: 'Claude', lastName: 'Nzayisenga', gender: 'MALE' as const },
  { firstName: 'Ange', lastName: 'Uwase', gender: 'FEMALE' as const },
  { firstName: 'Olivier', lastName: 'Twagirumukiza', gender: 'MALE' as const },
  { firstName: 'Josiane', lastName: 'Mukeshimana', gender: 'FEMALE' as const },
  { firstName: 'Didier', lastName: 'Sibomana', gender: 'MALE' as const },
  { firstName: 'Beata', lastName: 'Nyiraneza', gender: 'FEMALE' as const },
  { firstName: 'Alexis', lastName: 'Manirakiza', gender: 'MALE' as const },
  { firstName: 'Providence', lastName: 'Ingabire', gender: 'FEMALE' as const },
  { firstName: 'Moïse', lastName: 'Ndayisaba', gender: 'MALE' as const },
  { firstName: 'Grace', lastName: 'Umutesi', gender: 'FEMALE' as const },
  { firstName: 'Samuel', lastName: 'Niyigena', gender: 'MALE' as const },
  { firstName: 'Divine', lastName: 'Mukamuhizi', gender: 'FEMALE' as const },
  { firstName: 'Jean Claude', lastName: 'Habarurema', gender: 'MALE' as const },
  { firstName: 'Liliane', lastName: 'Uwamahoro', gender: 'FEMALE' as const },
  { firstName: 'Placide', lastName: 'Niyonsenga', gender: 'MALE' as const },
  { firstName: 'Donatille', lastName: 'Mukamana', gender: 'FEMALE' as const },
  { firstName: 'Fidèle', lastName: 'Rutayisire', gender: 'MALE' as const },
  { firstName: 'Esperance', lastName: 'Nyiransabimana', gender: 'FEMALE' as const },
  { firstName: 'Ignace', lastName: 'Bizimungu', gender: 'MALE' as const },
  { firstName: 'Solange', lastName: 'Mukantagara', gender: 'FEMALE' as const },
  { firstName: 'Théogène', lastName: 'Nshuti', gender: 'MALE' as const },
];

const KINYARWANDA_TEACHERS = [
  { firstName: 'Tharcisse', lastName: 'Mbarushimana', subject: 'Mathematics', qualification: 'M.Sc Mathematics' },
  { firstName: 'Consolee', lastName: 'Uwimbabazi', subject: 'English', qualification: 'B.Ed English' },
  { firstName: 'Jean de Dieu', lastName: 'Nsengimana', subject: 'Physics', qualification: 'M.Sc Physics' },
  { firstName: 'Speciose', lastName: 'Kamanzi', subject: 'Chemistry', qualification: 'B.Sc Chemistry' },
  { firstName: 'Godefroid', lastName: 'Hitimana', subject: 'Biology', qualification: 'M.Sc Biology' },
  { firstName: 'Francine', lastName: 'Umutesi', subject: 'History', qualification: 'B.A History' },
  { firstName: 'Pascal', lastName: 'Niyitegeka', subject: 'Geography', qualification: 'B.Ed Geography' },
  { firstName: 'Liberata', lastName: 'Mukamurera', subject: 'Kinyarwanda', qualification: 'B.A Kinyarwanda' },
];

const KINYARWANDA_PARENTS = [
  { firstName: 'Faustin', lastName: 'Niyonsaba', email: 'faustin.niyonsaba@parent.rw' },
  { firstName: 'Jeannette', lastName: 'Uwimana', email: 'jeannette.uwimana@parent.rw' },
  { firstName: 'Gérard', lastName: 'Habimana', email: 'gerard.habimana@parent.rw' },
  { firstName: 'Claudine', lastName: 'Mukamana', email: 'claudine.mukamana@parent.rw' },
  { firstName: 'Alphonse', lastName: 'Bizimana', email: 'alphonse.bizimana@parent.rw' },
  { firstName: 'Cécile', lastName: 'Mukamurenzi', email: 'cecile.mukamurenzi@parent.rw' },
  { firstName: 'Joseph', lastName: 'Niyonzima', email: 'joseph.niyonzima@parent.rw' },
  { firstName: 'Marie Louise', lastName: 'Uwera', email: 'marie.uwera@parent.rw' },
];

const LIBRARY_BOOKS = [
  { title: 'Amateka y\'u Rwanda', author: 'Alexis Kagame', category: 'History', description: 'Ibitabo byerekana amateka y\'u Rwanda kuva kera kugeza ubu.' },
  { title: 'Physics for Secondary Schools', author: 'MINEDUC', category: 'Science', description: 'Somo rya fiziki rigenewe abanyeshuri ba siniori.' },
  { title: 'Mathematics Vol. 1', author: 'Rwanda Education Board', category: 'Mathematics', description: 'Ibibazo n\'ibisubizo bya matematike by\'icyiciro cya mbere.' },
  { title: 'English Grammar in Use', author: 'Raymond Murphy', category: 'Languages', description: 'A practical guide to English grammar for learners.' },
  { title: 'Igihangano cy\'Imyitozo', author: 'REB', category: 'Kinyarwanda', description: 'Imyitozo n\'ibisubizo bya Kinyarwanda.' },
  { title: 'Chemistry Lab Manual', author: 'Speciose Kamanzi', category: 'Science', description: 'Amabwiriza yo gukora igerageza mu laboratoire.' },
  { title: 'Geography of East Africa', author: 'Pascal Niyitegeka', category: 'Geography', description: 'Ibirere, ibiyaga n\'imisozi y\'Afurika y\'Iburasirazuba.' },
  { title: 'Biology: Life Sciences', author: 'Godefroid Hitimana', category: 'Science', description: 'Ubuzima bw\'ibinyabuzima n\'imibereho yabyo.' },
  { title: 'Computer Studies', author: 'MINICT', category: 'ICT', description: 'Intangiriro ku bucuruzi bwa mudasobwa n\'ikoranabuhanga.' },
  { title: 'Financial Literacy', author: 'BNR', category: 'Commerce', description: 'Kumenya gukoresha amafaranga no kubika.' },
  { title: 'Umuco n\'Imigenzo', author: 'Liberata Mukamurera', category: 'Culture', description: 'Imigenzo n\'imico y\'Abanyarwanda.' },
  { title: 'World Literature Anthology', author: 'Various', category: 'Literature', description: 'Selected stories and poems from around the world.' },
  { title: 'Français: Grammaire Avancée', author: 'MINEDUC', category: 'Languages', description: 'Manuel de grammaire française pour le secondaire.' },
  { title: 'Entrepreneurship in Rwanda', author: 'RDB', category: 'Commerce', description: 'Gukora ubucuruzi n\'ubukorikori mu Rwanda.' },
  { title: 'Dictionnaire Kinyarwanda-Français', author: 'REB', category: 'Languages', description: 'Inkoranyamagambo y\'Ikinyarwanda n\'Igifaransa.' },
  { title: 'Agriculture et Développement Rural', author: 'MINAGRI', category: 'Agriculture', description: 'Ubuhinzi n\'ubworozi mu Rwanda.' },
  { title: 'Citizenship Education', author: 'MINEDUC', category: 'Civic', description: 'Ubunyamuryango n\'uburezi bwa politiki.' },
  { title: 'Art and Design', author: 'REB', category: 'Arts', description: 'Ubuhanzi n\'igishushanyo.' },
  { title: 'Music Theory Basics', author: 'MINISPOC', category: 'Arts', description: 'Iby\'umuziki n\'imyemerere y\'amajwi.' },
];

async function clearDemoData(schoolId: string) {
  const students = await prisma.student.findMany({ where: { schoolId }, select: { id: true, userId: true } });
  const studentIds = students.map((s) => s.id);
  const schoolUsers = await prisma.user.findMany({ where: { schoolId }, select: { id: true } });
  const userIds = schoolUsers.map((u) => u.id);

  await prisma.aiMessage.deleteMany({ where: { conversation: { schoolId } } });
  await prisma.aiConversation.deleteMany({ where: { schoolId } });
  await prisma.assignmentSubmission.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.assignment.deleteMany({ where: { class: { schoolId } } });
  await prisma.timetable.deleteMany({ where: { class: { schoolId } } });
  await prisma.transportAssignment.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.transportRoute.deleteMany({ where: { vehicle: { schoolId } } });
  await prisma.vehicle.deleteMany({ where: { schoolId } });
  await prisma.hostelAssignment.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.hostelRoom.deleteMany({ where: { schoolId } });
  await prisma.clinicVisit.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.medicineInventory.deleteMany({ where: { schoolId } });
  await prisma.leaveRequest.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.employee.deleteMany({ where: { schoolId } });
  await prisma.asset.deleteMany({ where: { schoolId } });
  await prisma.supplier.deleteMany({ where: { schoolId } });
  await prisma.message.deleteMany({
    where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] },
  });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.bookBorrowing.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.attendance.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.examResult.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.feeInvoice.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.studentGuardian.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.student.deleteMany({ where: { schoolId } });
  await prisma.teacher.deleteMany({ where: { schoolId } });
  const parentUsers = await prisma.user.findMany({ where: { schoolId, role: 'PARENT' }, select: { id: true } });
  await prisma.parent.deleteMany({ where: { userId: { in: parentUsers.map((u) => u.id) } } });
  await prisma.libraryBook.deleteMany({ where: { schoolId } });
  await prisma.announcement.deleteMany({ where: { schoolId } });
  await prisma.event.deleteMany({ where: { schoolId } });
  await prisma.exam.deleteMany({ where: { class: { schoolId } } });
  await prisma.classSubject.deleteMany({ where: { class: { schoolId } } });
  await prisma.class.deleteMany({ where: { schoolId } });
  await prisma.user.deleteMany({
    where: {
      schoolId,
      email: { notIn: ['admin@demoschool.edu', PROJECT_OWNER_EMAIL] },
    },
  });
}

async function main() {
  console.log('Seeding database with Kinyarwanda data...');

  const hashedPassword = await bcrypt.hash(PASSWORD, 12);

  const school = await prisma.school.upsert({
    where: { code: 'DEMO' },
    update: {
      currency: 'RWF',
      timezone: 'Africa/Kigali',
      country: 'Rwanda',
      city: 'Kigali',
      name: 'G.S. Demo Kigali',
      phone: '0781011343',
      email: PROJECT_OWNER_EMAIL,
    },
    create: {
      name: 'G.S. Demo Kigali',
      code: 'DEMO',
      motto: 'Ubumenyi ni Imbaraga',
      address: 'KN 3 Rd, Kicukiro',
      city: 'Kigali',
      country: 'Rwanda',
      phone: '0781011343',
      email: PROJECT_OWNER_EMAIL,
      website: 'https://gsdemo.rw',
      timezone: 'Africa/Kigali',
      currency: 'RWF',
      language: 'rw',
      establishedYear: 1985,
    },
  });

  await clearDemoData(school.id);

  const academicYear = await prisma.academicYear.upsert({
    where: { id: 'seed-academic-year' },
    update: { isCurrent: true },
    create: {
      id: 'seed-academic-year',
      schoolId: school.id,
      name: '2025/2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-07-31'),
      isCurrent: true,
    },
  });

  await prisma.term.upsert({
    where: { id: 'seed-term-1' },
    update: { isCurrent: true, status: 'ACTIVE' },
    create: {
      id: 'seed-term-1',
      academicYearId: academicYear.id,
      name: 'Term 1',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      status: 'ACTIVE',
      isCurrent: true,
    },
  });

  const departments = await Promise.all(
    [
      { name: 'Sciences', code: 'SCI' },
      { name: 'Languages', code: 'LAN' },
      { name: 'Commerce', code: 'COM' },
      { name: 'Arts', code: 'ART' },
    ].map((d) =>
      prisma.department.upsert({
        where: { schoolId_code: { schoolId: school.id, code: d.code } },
        update: {},
        create: { schoolId: school.id, ...d },
      })
    )
  );

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demoschool.edu' },
    update: { firstName: 'Emmanuel', lastName: 'Munyaneza', role: UserRole.SCHOOL_OWNER },
    create: {
      email: 'admin@demoschool.edu',
      password: hashedPassword,
      firstName: 'Emmanuel',
      lastName: 'Munyaneza',
      role: UserRole.SCHOOL_OWNER,
      schoolId: school.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: PROJECT_OWNER_EMAIL },
    update: {
      firstName: 'Hervin',
      lastName: 'Ishimwe',
      role: UserRole.SCHOOL_OWNER,
      schoolId: school.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      email: PROJECT_OWNER_EMAIL,
      password: hashedPassword,
      firstName: 'Hervin',
      lastName: 'Ishimwe',
      role: UserRole.SCHOOL_OWNER,
      schoolId: school.id,
      status: 'ACTIVE',
      emailVerified: true,
      phone: '0781011343',
    },
  });

  await prisma.user.upsert({
    where: { email: 'principal@demoschool.edu' },
    update: {},
    create: {
      email: 'principal@demoschool.edu',
      password: hashedPassword,
      firstName: 'Vestine',
      lastName: 'Nyiraminani',
      role: UserRole.PRINCIPAL,
      schoolId: school.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'librarian@demoschool.edu' },
    update: {},
    create: {
      email: 'librarian@demoschool.edu',
      password: hashedPassword,
      firstName: 'Claudette',
      lastName: 'Mukasine',
      role: UserRole.LIBRARIAN,
      schoolId: school.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const transportManager = await prisma.user.upsert({
    where: { email: 'transport@demoschool.edu' },
    update: {},
    create: {
      email: 'transport@demoschool.edu',
      password: hashedPassword,
      firstName: 'Jean Pierre',
      lastName: 'Habiyaremye',
      role: UserRole.TRANSPORT_MANAGER,
      schoolId: school.id,
      status: 'ACTIVE',
      emailVerified: true,
      phone: '+250788200001',
    },
  });

  const nurseUser = await prisma.user.upsert({
    where: { email: 'nurse@demoschool.edu' },
    update: {},
    create: {
      email: 'nurse@demoschool.edu',
      password: hashedPassword,
      firstName: 'Annonciata',
      lastName: 'Mukamana',
      role: UserRole.NURSE,
      schoolId: school.id,
      status: 'ACTIVE',
      emailVerified: true,
      phone: '+250788200002',
    },
  });

  const principalUser = await prisma.user.findUnique({ where: { email: 'principal@demoschool.edu' } });

  const classNames = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
  const classes = await Promise.all(
    classNames.map((name) =>
      prisma.class.create({
        data: { schoolId: school.id, academicYearId: academicYear.id, name, section: 'A', capacity: 45 },
      })
    )
  );

  const subjectDefs = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English', code: 'ENG' },
    { name: 'Kinyarwanda', code: 'KIN' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHEM' },
    { name: 'Biology', code: 'BIO' },
    { name: 'History', code: 'HIST' },
    { name: 'Geography', code: 'GEO' },
  ];

  const subjects = await Promise.all(
    subjectDefs.map((s, i) =>
      prisma.subject.upsert({
        where: { schoolId_code: { schoolId: school.id, code: s.code } },
        update: {},
        create: { schoolId: school.id, departmentId: departments[i % departments.length].id, ...s },
      })
    )
  );

  const teacherRecords: { id: string; userId: string }[] = [];
  for (let i = 0; i < KINYARWANDA_TEACHERS.length; i++) {
    const t = KINYARWANDA_TEACHERS[i];
    const email = `teacher${i + 1}@demoschool.edu`;
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: t.firstName,
        lastName: t.lastName,
        role: UserRole.TEACHER,
        schoolId: school.id,
        status: 'ACTIVE',
        emailVerified: true,
        phone: `+25078${String(1000000 + i).slice(-7)}`,
      },
    });
    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        departmentId: departments[0].id,
        employeeId: `TCH-${String(i + 1).padStart(4, '0')}`,
        qualification: t.qualification,
        specialization: t.subject,
      },
    });
    teacherRecords.push({ id: teacher.id, userId: user.id });
  }

  const studentRecords: { id: string; userId: string }[] = [];
  for (let i = 0; i < KINYARWANDA_STUDENTS.length; i++) {
    const s = KINYARWANDA_STUDENTS[i];
    const email = `student${i + 1}@demoschool.edu`;
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: s.firstName,
        lastName: s.lastName,
        role: UserRole.STUDENT,
        schoolId: school.id,
        status: 'ACTIVE',
        emailVerified: true,
        phone: `+25072${String(2000000 + i).slice(-7)}`,
      },
    });
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        classId: classes[i % classes.length].id,
        admissionNumber: `DEMO/2026/${String(i + 1).padStart(4, '0')}`,
        gender: s.gender,
        admissionDate: new Date('2025-09-01'),
        address: `Kigali, Umujyi wa Kigali`,
      },
    });
    studentRecords.push({ id: student.id, userId: user.id });
  }

  const parentRecords: { id: string; userId: string }[] = [];
  for (let i = 0; i < KINYARWANDA_PARENTS.length; i++) {
    const p = KINYARWANDA_PARENTS[i];
    const user = await prisma.user.create({
      data: {
        email: p.email,
        password: hashedPassword,
        firstName: p.firstName,
        lastName: p.lastName,
        role: UserRole.PARENT,
        schoolId: school.id,
        status: 'ACTIVE',
        emailVerified: true,
        phone: `+25073${String(3000000 + i).slice(-7)}`,
      },
    });
    const parent = await prisma.parent.create({
      data: { userId: user.id, occupation: 'Umukozi', relationship: 'Parent' },
    });
    parentRecords.push({ id: parent.id, userId: user.id });

    for (let j = 0; j < 2 && i * 2 + j < studentRecords.length; j++) {
      await prisma.studentGuardian.create({
        data: {
          studentId: studentRecords[i * 2 + j].id,
          parentId: parent.id,
          relationship: j === 0 ? 'Father' : 'Mother',
          isPrimary: j === 0,
        },
      });
    }
  }

  const books = await Promise.all(
    LIBRARY_BOOKS.map((b, i) =>
      prisma.libraryBook.create({
        data: {
          schoolId: school.id,
          ...b,
          isbn: `978-${String(1000000000 + i)}`,
          quantity: 5,
          available: 5,
          location: `Shelf ${String.fromCharCode(65 + (i % 6))}-${i + 1}`,
          publisher: 'REB Rwanda',
          publishYear: 2020 + (i % 5),
        },
      })
    )
  );

  const today = new Date();
  for (let i = 0; i < 15; i++) {
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + (i < 5 ? -3 : 14));
    const borrowedAt = new Date(today);
    borrowedAt.setDate(borrowedAt.getDate() - (7 + i));

    await prisma.bookBorrowing.create({
      data: {
        bookId: books[i % books.length].id,
        studentId: studentRecords[i % studentRecords.length].id,
        borrowedAt,
        dueDate,
        status: 'BORROWED',
        notes: i < 5 ? 'Igihe cyo gusubiza cyarenze / En retard' : `Emprunt #${i + 1}`,
      },
    });
    await prisma.libraryBook.update({
      where: { id: books[i % books.length].id },
      data: { available: { decrement: 1 } },
    });
  }

  for (let i = 0; i < 12; i++) {
    const returnedAt = new Date(today);
    returnedAt.setDate(returnedAt.getDate() - (i + 2));
    const borrowedAt = new Date(returnedAt);
    borrowedAt.setDate(borrowedAt.getDate() - 21);
    const dueDate = new Date(borrowedAt);
    dueDate.setDate(dueDate.getDate() + 14);
    const daysLate = Math.max(0, Math.floor((returnedAt.getTime() - dueDate.getTime()) / 86400000));

    await prisma.bookBorrowing.create({
      data: {
        bookId: books[(i + 3) % books.length].id,
        studentId: studentRecords[(i + 5) % studentRecords.length].id,
        borrowedAt,
        dueDate,
        returnedAt,
        fine: daysLate * 50,
        status: 'AVAILABLE',
        notes: daysLate > 0 ? `Retard de ${daysLate} jours / Yarenze iminsi ${daysLate}` : 'Retourné à temps / Byagaruriwe ku gihe',
      },
    });
  }

  for (let i = 0; i < 45; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (i % 30));
    await prisma.attendance.create({
      data: {
        studentId: studentRecords[i % studentRecords.length].id,
        classId: classes[i % classes.length].id,
        date: d,
        status: i % 7 === 0 ? 'ABSENT' : i % 5 === 0 ? 'LATE' : 'PRESENT',
      },
    });
  }

  await prisma.gradingSystem.deleteMany({ where: { schoolId: school.id } });
  await prisma.gradingSystem.createMany({
    data: [
      { schoolId: school.id, name: 'A', minScore: 80, maxScore: 100, grade: 'A', gradePoint: 4.0, remarks: 'Byiza cyane' },
      { schoolId: school.id, name: 'B', minScore: 70, maxScore: 79, grade: 'B', gradePoint: 3.0, remarks: 'Byiza' },
      { schoolId: school.id, name: 'C', minScore: 60, maxScore: 69, grade: 'C', gradePoint: 2.0, remarks: 'Hagati' },
      { schoolId: school.id, name: 'D', minScore: 50, maxScore: 59, grade: 'D', gradePoint: 1.0, remarks: 'Hasi' },
      { schoolId: school.id, name: 'F', minScore: 0, maxScore: 49, grade: 'F', gradePoint: 0.0, remarks: 'Yatsinzwe' },
    ],
  });

  const feeStructure = await prisma.feeStructure.create({
    data: {
      schoolId: school.id,
      name: 'Amafaranga y\'ishuri - Term 1',
      description: 'Amafaranga y\'ibanze y\'inyongera',
      amount: 350000,
      frequency: 'TERM',
      dueDate: new Date('2026-03-01'),
    },
  });

  for (let i = 0; i < 20; i++) {
    const amount = 350000;
    const paid = i < 8 ? amount : i < 14 ? amount / 2 : 0;
    await prisma.feeInvoice.create({
      data: {
        invoiceNumber: `INV-RW-${String(1000 + i)}`,
        studentId: studentRecords[i].id,
        feeStructureId: feeStructure.id,
        amount,
        totalAmount: amount,
        paidAmount: paid,
        balance: amount - paid,
        status: paid >= amount ? 'PAID' : paid > 0 ? 'PARTIAL' : 'SENT',
        dueDate: new Date('2026-03-01'),
      },
    });
  }

  const exam = await prisma.exam.create({
    data: {
      classId: classes[0].id,
      subjectId: subjects[0].id,
      name: 'Exam y\'icyiciro cya 1 - Mathematics',
      type: 'MID_TERM',
      status: 'PUBLISHED',
      totalMarks: 100,
      passMarks: 50,
      isPublished: true,
    },
  });

  for (let i = 0; i < 20; i++) {
    const marks = 45 + Math.floor(Math.random() * 50);
    await prisma.examResult.create({
      data: {
        examId: exam.id,
        studentId: studentRecords[i].id,
        marksObtained: marks,
        grade: marks >= 80 ? 'A' : marks >= 70 ? 'B' : marks >= 60 ? 'C' : marks >= 50 ? 'D' : 'F',
        rank: i + 1,
        isApproved: true,
      },
    });
  }

  await prisma.announcement.createMany({
    data: [
      {
        schoolId: school.id,
        authorId: adminUser.id,
        title: 'Murakaza neza mu mwaka w\'amashuri 2025/2026',
        content: 'Twishimiye kwakira abanyeshuri n\'abarimu mu mwaka w\'amashuri mushya. Twizere ko muzatsinda.',
        targetRoles: 'STUDENT,TEACHER,PARENT',
        isPinned: true,
      },
      {
        schoolId: school.id,
        authorId: adminUser.id,
        title: 'Itariki yo kwishyura amafaranga y\'ishuri',
        content: 'Amafaranga y\'ibanze agomba kwishyurwa mbere ya 1 Werurwe 2026. Murakoze.',
        targetRoles: 'STUDENT,PARENT',
        isPinned: false,
      },
      {
        schoolId: school.id,
        authorId: adminUser.id,
        title: 'Gahunda y\'isport ku wa 5',
        content: 'Umukino w\'amagare uzabera ku kibuga cya ishuri ku wa 5, guhera saa 2.',
        targetRoles: 'STUDENT,TEACHER',
        isPinned: false,
      },
    ],
  });

  await prisma.event.createMany({
    data: [
      { schoolId: school.id, title: 'Parent-Teacher Meeting', description: 'Inama y\'ababyeyi n\'abarimu', startDate: new Date('2026-04-15'), location: 'Main Hall' },
      { schoolId: school.id, title: 'Science Fair', description: 'Imurikagurisha ry\'ubumenyi', startDate: new Date('2026-05-20'), location: 'Science Block' },
      { schoolId: school.id, title: 'End of Term Exams', description: 'Ibyanza bya term 1', startDate: new Date('2026-06-01'), location: 'All Classrooms' },
      { schoolId: school.id, title: 'Graduation Ceremony', description: 'Umunsi mukuru wo gusoza S6', startDate: new Date('2026-07-15'), location: 'School Grounds' },
    ],
  });

  // ─── Transport ───
  const vehicleDefs = [
    { registration: 'RAB 123 A', make: 'Toyota', model: 'Coaster', capacity: 30, driverName: 'Théophile Nsengimana', driverPhone: '+250788301001' },
    { registration: 'RAB 456 B', make: 'Toyota', model: 'Hiace', capacity: 14, driverName: 'Emmanuel Mugabo', driverPhone: '+250788301002' },
    { registration: 'RAB 789 C', make: 'Hyundai', model: 'County', capacity: 45, driverName: 'Jean Bosco Uwimana', driverPhone: '+250788301003' },
    { registration: 'RAB 321 D', make: 'Isuzu', model: 'NQR', capacity: 35, driverName: 'Alexis Niyonsenga', driverPhone: '+250788301004' },
  ];
  const routeDefs = [
    { name: 'Remera → Kicukiro', startPoint: 'Remera Taxi Park', endPoint: 'G.S. Demo Kigali', fee: 25000 },
    { name: 'Kimironko → Nyarugenge', startPoint: 'Kimironko Market', endPoint: 'G.S. Demo Kigali', fee: 30000 },
    { name: 'Gikondo → Kicukiro', startPoint: 'Gikondo Industrial', endPoint: 'G.S. Demo Kigali', fee: 20000 },
    { name: 'Nyamirambo → City Center', startPoint: 'Nyamirambo Stadium', endPoint: 'G.S. Demo Kigali', fee: 28000 },
  ];
  const pickupPoints = ['Remera Taxi Park', 'Kimironko Market', 'Gikondo Industrial', 'Nyamirambo Stadium'];
  const vehicles: { id: string }[] = [];
  const routes: { id: string; vehicleId: string }[] = [];
  for (let i = 0; i < vehicleDefs.length; i++) {
    const v = await prisma.vehicle.create({ data: { schoolId: school.id, ...vehicleDefs[i] } });
    vehicles.push(v);
    const route = await prisma.transportRoute.create({
      data: { vehicleId: v.id, ...routeDefs[i], stops: JSON.stringify(['Stop A', 'Stop B', 'Stop C']) },
    });
    routes.push({ id: route.id, vehicleId: v.id });
  }
  for (let i = 0; i < 18; i++) {
    await prisma.transportAssignment.create({
      data: {
        studentId: studentRecords[i].id,
        vehicleId: vehicles[i % vehicles.length].id,
        routeId: routes[i % routes.length].id,
        pickupPoint: pickupPoints[i % pickupPoints.length],
      },
    });
  }

  // ─── Hostel ───
  const hostelRoomDefs = [
    { name: 'Block A - 101 (Boys)', floor: 1, capacity: 4 },
    { name: 'Block A - 102 (Boys)', floor: 1, capacity: 4 },
    { name: 'Block A - 201 (Boys)', floor: 2, capacity: 4 },
    { name: 'Block A - 202 (Boys)', floor: 2, capacity: 4 },
    { name: 'Block B - 101 (Girls)', floor: 1, capacity: 4 },
    { name: 'Block B - 102 (Girls)', floor: 1, capacity: 4 },
    { name: 'Block B - 201 (Girls)', floor: 2, capacity: 4 },
    { name: 'Block B - 202 (Girls)', floor: 2, capacity: 4 },
    { name: 'Block C - 301 (Boys)', floor: 3, capacity: 6 },
    { name: 'Block C - 302 (Girls)', floor: 3, capacity: 6 },
    { name: 'Block D - 401 (Staff)', floor: 4, capacity: 2 },
    { name: 'Block D - 402 (Staff)', floor: 4, capacity: 2 },
  ];
  const hostelRooms: { id: string; capacity: number }[] = [];
  for (const room of hostelRoomDefs) {
    hostelRooms.push(await prisma.hostelRoom.create({ data: { schoolId: school.id, ...room } }));
  }
  const bedLabels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  for (let i = 0; i < 20; i++) {
    const room = hostelRooms[i % 10];
    await prisma.hostelAssignment.create({
      data: { studentId: studentRecords[i].id, roomId: room.id, bedNumber: bedLabels[i % bedLabels.length] },
    });
    const updated = await prisma.hostelRoom.update({
      where: { id: room.id },
      data: { occupied: { increment: 1 } },
    });
    if (updated.occupied >= updated.capacity) {
      await prisma.hostelRoom.update({ where: { id: room.id }, data: { status: RoomStatus.OCCUPIED } });
    }
  }

  // ─── Health ───
  const clinicVisits = [
    { symptoms: 'Umuriro n\'umutwe', diagnosis: 'Indwara yo mu muhondo', treatment: 'Kuryama no kunywa amazi', medication: 'Paracetamol 500mg' },
    { symptoms: 'Kuruka n\'ububabare mu nda', diagnosis: 'Indwara yo mu nda', treatment: 'Gufata amazi menshi', medication: 'Oral Rehydration Salts' },
    { symptoms: 'Gukorora n\'umuhondo', diagnosis: 'Indwara yo mu muhondo', treatment: 'Kumva mu cyumba cy\'ubuvuzi', medication: 'Amoxicillin 250mg' },
    { symptoms: 'Uburibwe bw\'amaso', diagnosis: 'Allergies', treatment: 'Kwirinda ibintu byitera', medication: 'Cetirizine 10mg' },
    { symptoms: 'Kuvutsa mu gatuza', diagnosis: 'Injury yo mu gatuza', treatment: 'Gushyira ice pack', medication: 'Ibuprofen 400mg' },
    { symptoms: 'Umuriro wo hejuru', diagnosis: 'Indwara y\'umuriro', treatment: 'Gufata Paracetamol', medication: 'Paracetamol 500mg' },
    { symptoms: 'Kuvuza cyane', diagnosis: 'Indwara yo mu muhondo', treatment: 'Kumva no kunywa amazi', medication: 'Honey lemon syrup' },
    { symptoms: 'Uburibwe bw\'umutwe', diagnosis: 'Tension headache', treatment: 'Kuryama no kuruhuka', medication: 'Paracetamol 500mg' },
    { symptoms: 'Amababi y\'umubiri', diagnosis: 'Allergic reaction', treatment: 'Gufata antihistamine', medication: 'Loratadine 10mg' },
    { symptoms: 'Kuvuza n\'umuhondo', diagnosis: 'Common cold', treatment: 'Kumva mu cyumba', medication: 'Vitamin C' },
    { symptoms: 'Kubabara mu gatuza', diagnosis: 'Muscle strain', treatment: 'Gushyira ice pack', medication: 'Diclofenac gel' },
    { symptoms: 'Indwara yo mu nda', diagnosis: 'Food intolerance', treatment: 'Gufata amazi menshi', medication: 'Antacid tablets' },
    { symptoms: 'Umuriro w\'umubiri', diagnosis: 'Fever', treatment: 'Gupima umuriro buri gihe', medication: 'Paracetamol 500mg' },
    { symptoms: 'Kuvuza mu minwe', diagnosis: 'Minor cut', treatment: 'Gusukura no gufata bandage', medication: 'Antiseptic cream' },
    { symptoms: 'Kuvuza mu minwe y\'ibirenge', diagnosis: 'Athlete foot', treatment: 'Gusukura neza', medication: 'Antifungal cream' },
    { symptoms: 'Umutwe ukababara', diagnosis: 'Migraine', treatment: 'Kuryama mu cyumba cyijimye', medication: 'Paracetamol 500mg' },
    { symptoms: 'Kuvuza mu minwe y\'intoki', diagnosis: 'Paper cut', treatment: 'Gusukura no gufata plaster', medication: 'Antiseptic' },
    { symptoms: 'Kuvuza mu minwe y\'amaso', diagnosis: 'Eye irritation', treatment: 'Gusukura amaso n\'amazi', medication: 'Eye drops' },
    { symptoms: 'Kuvuza mu minwe y\'umuhondo', diagnosis: 'Sore throat', treatment: 'Kunywa amazi ashushanyije', medication: 'Throat lozenges' },
    { symptoms: 'Kuvuza mu minwe y\'intoki', diagnosis: 'Splinter', treatment: 'Gukuramo no gusukura', medication: 'Antiseptic cream' },
  ];
  for (let i = 0; i < clinicVisits.length; i++) {
    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() - (i * 2 + 1));
    await prisma.clinicVisit.create({
      data: {
        studentId: studentRecords[i % studentRecords.length].id,
        visitDate,
        nurseId: nurseUser.id,
        followUpDate: i % 4 === 0 ? new Date(visitDate.getTime() + 7 * 86400000) : undefined,
        ...clinicVisits[i],
      },
    });
  }
  const medicines = [
    { name: 'Paracetamol 500mg (Panadol)', quantity: 2400, unit: 'tablets', reorderLevel: 400 },
    { name: 'Amoxicillin 250mg Capsules', quantity: 800, unit: 'capsules', reorderLevel: 150 },
    { name: 'Ibuprofen 400mg', quantity: 600, unit: 'tablets', reorderLevel: 100 },
    { name: 'Coartem (Artemether/Lumefantrine 20/120)', quantity: 120, unit: 'doses', reorderLevel: 30 },
    { name: 'Zinc Sulphate 20mg (Pediatric)', quantity: 300, unit: 'tablets', reorderLevel: 60 },
    { name: 'Oral Rehydration Salts (ORS)', quantity: 180, unit: 'sachets', reorderLevel: 40 },
    { name: 'Cetirizine 10mg (Antihistamine)', quantity: 200, unit: 'tablets', reorderLevel: 50 },
    { name: 'Metronidazole 400mg', quantity: 150, unit: 'tablets', reorderLevel: 40 },
    { name: 'Albendazole 400mg (Deworming)', quantity: 90, unit: 'tablets', reorderLevel: 25 },
    { name: 'Chlorhexidine Antiseptic 0.5%', quantity: 24, unit: 'bottles', reorderLevel: 6 },
    { name: 'Hydrogen Peroxide 3%', quantity: 18, unit: 'bottles', reorderLevel: 5 },
    { name: 'Betadine Povidone Iodine', quantity: 12, unit: 'bottles', reorderLevel: 4 },
    { name: 'Gauze Roll 10cm x 5m', quantity: 85, unit: 'rolls', reorderLevel: 20 },
    { name: 'Elastic Bandage 10cm', quantity: 60, unit: 'pieces', reorderLevel: 15 },
    { name: 'Adhesive Plasters (Assorted)', quantity: 500, unit: 'pieces', reorderLevel: 100 },
    { name: 'Surgical Gloves (Medium, Latex-free)', quantity: 400, unit: 'pairs', reorderLevel: 80 },
    { name: 'Disposable Syringes 5ml', quantity: 250, unit: 'units', reorderLevel: 50 },
    { name: 'Malaria RDT (mRDT) Test Kits', quantity: 45, unit: 'kits', reorderLevel: 15 },
    { name: 'Digital Thermometers', quantity: 10, unit: 'units', reorderLevel: 3 },
    { name: 'Blood Pressure Monitor', quantity: 2, unit: 'units', reorderLevel: 1 },
    { name: 'Salbutamol Inhaler 100mcg', quantity: 8, unit: 'inhalers', reorderLevel: 3 },
    { name: 'Eye Drops (Chloramphenicol 0.5%)', quantity: 20, unit: 'bottles', reorderLevel: 6 },
    { name: 'Throat Lozenges (Honey Lemon)', quantity: 120, unit: 'pieces', reorderLevel: 30 },
    { name: 'Antacid Tablets (Aluminium Hydroxide)', quantity: 180, unit: 'tablets', reorderLevel: 40 },
    { name: 'Vitamin C 500mg Chewable', quantity: 350, unit: 'tablets', reorderLevel: 70 },
    { name: 'Multivitamin Syrup (Children)', quantity: 15, unit: 'bottles', reorderLevel: 5 },
    { name: 'Antifungal Cream (Clotrimazole 1%)', quantity: 22, unit: 'tubes', reorderLevel: 6 },
    { name: 'Burn Gel (Hydrogel)', quantity: 14, unit: 'tubes', reorderLevel: 4 },
    { name: 'First Aid Kits (Complete)', quantity: 6, unit: 'kits', reorderLevel: 2 },
    { name: 'Emergency Stretcher', quantity: 1, unit: 'unit', reorderLevel: 1 },
    { name: 'Ice Packs (Reusable)', quantity: 8, unit: 'units', reorderLevel: 3 },
    { name: 'Face Masks (Surgical, Box of 50)', quantity: 12, unit: 'boxes', reorderLevel: 4 },
  ];
  for (let i = 0; i < medicines.length; i++) {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1 + (i % 2));
    await prisma.medicineInventory.create({
      data: { schoolId: school.id, ...medicines[i], expiryDate: expiry },
    });
  }

  // ─── HR ───
  const employeeDefs = [
    { userId: adminUser.id, employeeId: 'EMP-0001', department: 'Administration', designation: 'School Owner', salary: 2500000, contractType: 'Permanent' },
    ...(principalUser ? [{ userId: principalUser.id, employeeId: 'EMP-0002', department: 'Administration', designation: 'Principal', salary: 2200000, contractType: 'Permanent' }] : []),
    { userId: transportManager.id, employeeId: 'EMP-0003', department: 'Transport', designation: 'Transport Manager', salary: 800000, contractType: 'Permanent' },
    { userId: nurseUser.id, employeeId: 'EMP-0004', department: 'Health', designation: 'School Nurse', salary: 750000, contractType: 'Permanent' },
    ...teacherRecords.slice(0, 5).map((t, i) => ({
      userId: t.userId,
      employeeId: `EMP-${String(1005 + i)}`,
      department: 'Academics',
      designation: KINYARWANDA_TEACHERS[i].subject + ' Teacher',
      salary: 900000 + i * 50000,
      contractType: 'Permanent' as const,
    })),
  ];
  for (const emp of employeeDefs) {
    await prisma.employee.create({ data: { schoolId: school.id, ...emp } });
  }
  const leaveDefs = [
    { userId: teacherRecords[0].userId, teacherId: teacherRecords[0].id, leaveType: 'Annual', days: 5, reason: 'Gusura umuryango', status: LeaveStatus.APPROVED },
    { userId: teacherRecords[1].userId, teacherId: teacherRecords[1].id, leaveType: 'Sick', days: 2, reason: 'Indwara yo mu muhondo', status: LeaveStatus.APPROVED },
    { userId: teacherRecords[2].userId, teacherId: teacherRecords[2].id, leaveType: 'Annual', days: 7, reason: 'Ikiruhuko cy\'umuryango', status: LeaveStatus.PENDING },
    { userId: teacherRecords[3].userId, teacherId: teacherRecords[3].id, leaveType: 'Maternity', days: 90, reason: 'Ikiruhuko cy\'ababyarira', status: LeaveStatus.APPROVED },
    { userId: teacherRecords[4].userId, teacherId: teacherRecords[4].id, leaveType: 'Annual', days: 3, reason: 'Inama y\'umuryango', status: LeaveStatus.REJECTED },
    { userId: teacherRecords[5].userId, teacherId: teacherRecords[5].id, leaveType: 'Sick', days: 1, reason: 'Umuriro', status: LeaveStatus.PENDING },
    { userId: teacherRecords[6].userId, teacherId: teacherRecords[6].id, leaveType: 'Annual', days: 4, reason: 'Gusura abo mu cyaro', status: LeaveStatus.APPROVED },
    { userId: teacherRecords[7].userId, teacherId: teacherRecords[7].id, leaveType: 'Study', days: 10, reason: 'Amahugurwa y\'ubumenyi', status: LeaveStatus.PENDING },
    { userId: nurseUser.id, leaveType: 'Annual', days: 3, reason: 'Ikiruhuko cy\'umwaka', status: LeaveStatus.APPROVED },
    { userId: transportManager.id, leaveType: 'Annual', days: 2, reason: 'Inama y\'ubwikorezi', status: LeaveStatus.PENDING },
  ];
  for (let i = 0; i < leaveDefs.length; i++) {
    const start = new Date();
    start.setDate(start.getDate() + (i * 7 + 3));
    const end = new Date(start);
    end.setDate(end.getDate() + leaveDefs[i].days);
    await prisma.leaveRequest.create({
      data: {
        userId: leaveDefs[i].userId,
        teacherId: leaveDefs[i].teacherId,
        leaveType: leaveDefs[i].leaveType,
        startDate: start,
        endDate: end,
        reason: leaveDefs[i].reason,
        status: leaveDefs[i].status,
        approvedBy: leaveDefs[i].status === LeaveStatus.APPROVED ? adminUser.id : undefined,
        approvedAt: leaveDefs[i].status === LeaveStatus.APPROVED ? new Date() : undefined,
      },
    });
  }

  // ─── Inventory ───
  const suppliers = await Promise.all(
    [
      { name: 'Kigali EdTech Ltd', contact: 'Eric Nshimiyimana', email: 'sales@kigaliedtech.rw', phone: '+250788400001', address: 'KN 5 Rd, Kigali' },
      { name: 'Rwanda Office Supplies', contact: 'Marie Uwimana', email: 'info@rwandaoffice.rw', phone: '+250788400002', address: 'Nyabugogo, Kigali' },
      { name: 'Tech Solutions Rwanda', contact: 'Patrick Bizimana', email: 'orders@techsolutions.rw', phone: '+250788400003', address: 'Remera, Kigali' },
      { name: 'Green Furniture Co.', contact: 'Consolee Mukamana', email: 'hello@greenfurniture.rw', phone: '+250788400004', address: 'Gikondo, Kigali' },
      { name: 'MedSupply Rwanda', contact: 'Annonciata Uwase', email: 'clinic@medsupply.rw', phone: '+250788400005', address: 'Kacyiru, Kigali' },
    ].map((s) => prisma.supplier.create({ data: { schoolId: school.id, ...s } }))
  );
  const assetDefs = [
    { name: 'Dell Laptop Inspiron 15', category: 'ICT', serialNumber: 'DELL-RW-001', location: 'Computer Lab 1', cost: 850000, status: AssetStatus.IN_USE },
    { name: 'Dell Laptop Inspiron 15', category: 'ICT', serialNumber: 'DELL-RW-002', location: 'Computer Lab 1', cost: 850000, status: AssetStatus.IN_USE },
    { name: 'HP ProBook 450', category: 'ICT', serialNumber: 'HP-RW-003', location: 'Admin Office', cost: 920000, status: AssetStatus.IN_USE },
    { name: 'Epson Projector EB-X06', category: 'Electronics', serialNumber: 'EPS-RW-001', location: 'Room S1-A', cost: 650000, status: AssetStatus.IN_USE },
    { name: 'Epson Projector EB-X06', category: 'Electronics', serialNumber: 'EPS-RW-002', location: 'Room S2-A', cost: 650000, status: AssetStatus.IN_USE },
    { name: 'Samsung Smart Board 65"', category: 'Electronics', serialNumber: 'SAM-RW-001', location: 'Science Lab', cost: 3200000, status: AssetStatus.ACTIVE },
    { name: 'Student Desk (Wood)', category: 'Furniture', serialNumber: 'DSK-RW-001', location: 'Block A', cost: 45000, status: AssetStatus.IN_USE },
    { name: 'Student Desk (Wood)', category: 'Furniture', serialNumber: 'DSK-RW-002', location: 'Block A', cost: 45000, status: AssetStatus.IN_USE },
    { name: 'Teacher Chair (Ergonomic)', category: 'Furniture', serialNumber: 'CHR-RW-001', location: 'Staff Room', cost: 120000, status: AssetStatus.IN_USE },
    { name: 'Library Bookshelf', category: 'Furniture', serialNumber: 'SHF-RW-001', location: 'Library', cost: 280000, status: AssetStatus.ACTIVE },
    { name: 'Canon Printer MF445dw', category: 'ICT', serialNumber: 'CAN-RW-001', location: 'Admin Office', cost: 480000, status: AssetStatus.IN_USE },
    { name: 'Microscope (Biology Lab)', category: 'Lab Equipment', serialNumber: 'MIC-RW-001', location: 'Biology Lab', cost: 750000, status: AssetStatus.ACTIVE },
    { name: 'Chemistry Lab Kit', category: 'Lab Equipment', serialNumber: 'CHE-RW-001', location: 'Chemistry Lab', cost: 1200000, status: AssetStatus.ACTIVE },
    { name: 'Volleyball Net Set', category: 'Sports', serialNumber: 'SPT-RW-001', location: 'Sports Ground', cost: 85000, status: AssetStatus.ACTIVE },
    { name: 'Football Set (10 balls)', category: 'Sports', serialNumber: 'SPT-RW-002', location: 'Sports Ground', cost: 150000, status: AssetStatus.IN_USE },
    { name: 'Generator 15KVA', category: 'Utilities', serialNumber: 'GEN-RW-001', location: 'Maintenance Room', cost: 4500000, status: AssetStatus.ACTIVE },
    { name: 'Water Tank 5000L', category: 'Utilities', serialNumber: 'WTR-RW-001', location: 'Roof Block B', cost: 680000, status: AssetStatus.ACTIVE },
    { name: 'Security Camera System', category: 'Security', serialNumber: 'SEC-RW-001', location: 'Main Gate', cost: 2100000, status: AssetStatus.ACTIVE },
    { name: 'School Bus Radio', category: 'Transport', serialNumber: 'TRN-RW-001', location: 'RAB 123 A', cost: 95000, status: AssetStatus.IN_USE },
    { name: 'First Aid Cabinet', category: 'Health', serialNumber: 'HLT-RW-001', location: 'Clinic', cost: 180000, status: AssetStatus.ACTIVE },
  ];
  for (let i = 0; i < assetDefs.length; i++) {
    const purchaseDate = new Date();
    purchaseDate.setMonth(purchaseDate.getMonth() - (i * 2 + 1));
    await prisma.asset.create({
      data: {
        schoolId: school.id,
        name: assetDefs[i].name,
        category: assetDefs[i].category,
        serialNumber: assetDefs[i].serialNumber,
        location: assetDefs[i].location,
        purchaseCost: assetDefs[i].cost,
        purchaseDate,
        status: assetDefs[i].status,
        assignedTo: i < 3 ? teacherRecords[i].userId : undefined,
      },
    });
  }

  // ─── Communication (messages & notifications) ───
  const messageDefs = [
    { senderId: principalUser!.id, receiverId: adminUser.id, subject: 'Raporo y\'imyitozo', content: 'Muraho, ndashaka gutanga raporo y\'imyitozo ya buri cyumweru. Twizere ko tuzabona inama ku wa 5.' },
    { senderId: teacherRecords[0].userId, receiverId: adminUser.id, subject: 'Ibikoresho bya Mathematics', content: 'Dukeneye ibikoresho by\'inyongera bya geometri mu cyumba cya S3.' },
    { senderId: adminUser.id, receiverId: teacherRecords[1].userId, subject: 'Inama y\'abarimu', content: 'Inama y\'abarimu izabera ku wa 3 saa 2 mu nzu nini. Mwitegure gutanga raporo z\'amashuri.' },
    { senderId: parentRecords[0].userId, receiverId: adminUser.id, subject: 'Kubaza ku amafaranga', content: 'Muraho, nshaka kubaza ku buryo bwo kwishyura amafaranga y\'ishuri mu bisubizo by\'ibice.' },
    { senderId: teacherRecords[2].userId, receiverId: principalUser!.id, subject: 'Laboratory maintenance', content: 'Laboratory ya Physics ikeneye gusuzumwa. Hari ibikoresho byangiritse.' },
    { senderId: transportManager.id, receiverId: adminUser.id, subject: 'Gahunda y\'ubwikorezi', content: 'Twashyizeho inzira nshya ya Remera-Kicukiro. Abanyeshuri 5 bashyizwe ku bushasho.' },
    { senderId: nurseUser.id, receiverId: principalUser!.id, subject: 'Raporo y\'ubuzima', content: 'Mu cyumweru gishize twakiriye abanyeshuri 8 mu kigo cy\'ubuvuzi. Hari indwara yo mu muhondo ikomeye.' },
    { senderId: adminUser.id, receiverId: parentRecords[1].userId, subject: 'Itariki yo kwishyura', content: 'Twibutsa ko amafaranga y\'ibanze agomba kwishyurwa mbere ya 1 Werurwe 2026.' },
    { senderId: teacherRecords[3].userId, receiverId: teacherRecords[4].userId, subject: 'Science department meeting', content: 'Tugomba guhurira ejo saa 1 kugira ngo tuvugane ku gahunda y\'ibizamini.' },
    { senderId: principalUser!.id, receiverId: teacherRecords[0].userId, subject: 'Commendation', content: 'Murakoze ku mwaka w\'amashuri mwiza. Abanyeshuri bawe batsinze neza mu bizamini.' },
  ];
  for (const msg of messageDefs) {
    await prisma.message.create({
      data: { ...msg, status: MessageStatus.READ, readAt: new Date() },
    });
  }
  const notificationDefs = [
    { userId: adminUser.id, type: NotificationType.INFO, title: 'New leave request', message: 'Tharcisse Mbarushimana asaba ikiruhuko cy\'iminsi 7.' },
    { userId: adminUser.id, type: NotificationType.WARNING, title: 'Overdue library books', message: '5 abanyeshuri bafite ibitabo byarenze igihe cyo kubisubiza.' },
    { userId: adminUser.id, type: NotificationType.REMINDER, title: 'Fee payment reminder', message: '12 abanyeshuri batarishyura amafaranga y\'ibanze.' },
    { userId: teacherRecords[0].userId, type: NotificationType.INFO, title: 'Assignment submitted', message: 'Jean Baptiste Niyonsaba yatanze umwanya wa Mathematics.' },
    { userId: teacherRecords[1].userId, type: NotificationType.SUCCESS, title: 'Leave approved', message: 'Ikiruhuko cyawe cyemewe na administrasiyo.' },
    { userId: parentRecords[0].userId, type: NotificationType.REMINDER, title: 'Parent meeting', message: 'Inama y\'ababyeyi izabera ku wa 15 Mata 2026.' },
    { userId: studentRecords[0].userId, type: NotificationType.INFO, title: 'New assignment', message: 'Umwanya mushya wa Mathematics — due 15 Mata 2026.' },
    { userId: studentRecords[1].userId, type: NotificationType.WARNING, title: 'Library overdue', message: 'Igitabo cyawe cyarenze igihe cyo kubisubiza. Fata amande 150 RWF.' },
    { userId: transportManager.id, type: NotificationType.INFO, title: 'Vehicle maintenance', message: 'RAB 456 B igomba gusuzumwa ku wa 10.' },
    { userId: nurseUser.id, type: NotificationType.WARNING, title: 'Low medicine stock', message: 'Paracetamol 500mg irashira — reba ibikoresho by\'ubuvuzi.' },
    { userId: principalUser!.id, type: NotificationType.ANNOUNCEMENT, title: 'Staff meeting', message: 'Inama y\'abarimu ku wa 3 saa 2 mu nzu nini.' },
    { userId: teacherRecords[2].userId, type: NotificationType.INFO, title: 'Exam schedule', message: 'Ibizamini bya Physics bizabera ku wa 20.' },
    { userId: parentRecords[2].userId, type: NotificationType.SUCCESS, title: 'Payment received', message: 'Amafaranga y\'ishuri yishyuwe neza — murakoze.' },
    { userId: studentRecords[5].userId, type: NotificationType.INFO, title: 'Hostel check-in', message: 'Wemewe mu cyumba Block A - 101, uburiri A2.' },
    { userId: adminUser.id, type: NotificationType.ERROR, title: 'System backup', message: 'Backup ya buri cyumweru yarangiye neza.' },
  ];
  for (const n of notificationDefs) {
    await prisma.notification.create({
      data: { ...n, channel: NotificationChannel.IN_APP, isRead: false },
    });
  }

  // ─── Timetable (realistic Rwanda O-Level weekly schedule) ───
  const periodSlots = [
    { startTime: '07:30', endTime: '08:30' },
    { startTime: '08:30', endTime: '09:30' },
    { startTime: '09:45', endTime: '10:45' },
    { startTime: '10:45', endTime: '11:45' },
    { startTime: '12:30', endTime: '13:30' },
    { startTime: '13:30', endTime: '14:30' },
  ];
  const weeklyPlan = [
    ['Mathematics', 'English', 'Kinyarwanda', 'Physics', 'Geography', 'Biology'],
    ['Chemistry', 'Mathematics', 'History', 'English', 'Physics', 'Kinyarwanda'],
    ['Biology', 'Geography', 'Mathematics', 'Chemistry', 'English', 'History'],
    ['English', 'Physics', 'Mathematics', 'Biology', 'Kinyarwanda', 'Chemistry'],
    ['History', 'Biology', 'English', 'Geography', 'Mathematics', 'Physics'],
  ];
  const classRooms = ['Block A - S1', 'Block A - S2', 'Block B - S3', 'Block B - S4', 'Science Lab - S5', 'Hall C - S6'];
  const subjectByName = Object.fromEntries(subjects.map((s) => [s.name, s]));
  const teacherBySubject = Object.fromEntries(
    KINYARWANDA_TEACHERS.map((t, i) => [t.subject, teacherRecords[i]?.id]).filter(([, id]) => id)
  );
  const getTeacherId = (subjectName: string, periodIdx: number) =>
    teacherBySubject[subjectName] || teacherRecords[periodIdx % teacherRecords.length].id;

  for (let ci = 0; ci < classes.length; ci++) {
    const cls = classes[ci];
    for (let day = 1; day <= 5; day++) {
      const daySubjects = weeklyPlan[day - 1];
      for (let p = 0; p < periodSlots.length; p++) {
        const subjectName = daySubjects[p];
        const subj = subjectByName[subjectName];
        if (!subj) continue;
        await prisma.timetable.create({
          data: {
            classId: cls.id,
            dayOfWeek: day,
            startTime: periodSlots[p].startTime,
            endTime: periodSlots[p].endTime,
            subjectId: subj.id,
            teacherId: getTeacherId(subjectName, p),
            room: `${classRooms[ci % classRooms.length]} · ${p < 4 ? 'Morning' : 'Afternoon'}`,
          },
        });
      }
    }
  }

  // ─── Online Learning (assignments & submissions) ───
  const assignmentDefs = [
    { classIdx: 0, subjectIdx: 0, title: 'Algebra Exercise Set 1', description: 'Solving linear equations and inequalities — submit handwritten work.', marks: 20, dueDays: 7 },
    { classIdx: 0, subjectIdx: 1, title: 'Essay: My Community', description: 'Write a 500-word essay about your community in English.', marks: 25, dueDays: 10 },
    { classIdx: 1, subjectIdx: 3, title: 'Physics Lab Report', description: 'Report on pendulum experiment — include graphs and analysis.', marks: 30, dueDays: 5 },
    { classIdx: 1, subjectIdx: 4, title: 'Chemistry: Periodic Table Quiz', description: 'Complete the periodic table worksheet and submit online.', marks: 15, dueDays: 3 },
    { classIdx: 2, subjectIdx: 5, title: 'Biology: Cell Structure Diagram', description: 'Draw and label plant and animal cell structures.', marks: 20, dueDays: 8 },
    { classIdx: 2, subjectIdx: 6, title: 'History: Rwanda Independence', description: 'Research paper on Rwanda\'s path to independence (1962).', marks: 30, dueDays: 14 },
    { classIdx: 3, subjectIdx: 7, title: 'Geography: Map Reading', description: 'Complete topographic map exercises for Kigali region.', marks: 20, dueDays: 6 },
    { classIdx: 3, subjectIdx: 2, title: 'Kinyarwanda: Igihangano', description: 'Andika igihangano gito cy\'amagambo 300.', marks: 25, dueDays: 12 },
    { classIdx: 4, subjectIdx: 0, title: 'Calculus Problem Set', description: 'Differentiation and integration exercises from Chapter 5.', marks: 35, dueDays: 9 },
    { classIdx: 5, subjectIdx: 1, title: 'English: Literature Analysis', description: 'Analyze the themes in "Things Fall Apart" — 800 words.', marks: 40, dueDays: 15 },
  ];
  const createdAssignments: { id: string; classIdx: number; marks: number }[] = [];
  for (const a of assignmentDefs) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + a.dueDays);
    const assignment = await prisma.assignment.create({
      data: {
        classId: classes[a.classIdx].id,
        subjectId: subjects[a.subjectIdx].id,
        title: a.title,
        description: a.description,
        dueDate,
        totalMarks: a.marks,
        createdBy: teacherRecords[a.subjectIdx % teacherRecords.length].userId,
        attachments: {
          fileName: `${a.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          mimeType: 'application/pdf',
        },
      },
    });
    createdAssignments.push({ id: assignment.id, classIdx: a.classIdx, marks: a.marks });
  }
  let submissionCount = 0;
  for (const assignment of createdAssignments) {
    const classStudents = studentRecords.filter((_, idx) => idx % classes.length === assignment.classIdx);
    const submitters = classStudents.length > 0 ? classStudents : studentRecords.slice(0, 6);
    for (let j = 0; j < Math.min(submitters.length, 6); j++) {
      const marks = 10 + Math.floor(Math.random() * (assignment.marks - 10));
      const submittedAt = new Date();
      submittedAt.setDate(submittedAt.getDate() - (j + 1));
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignment.id,
          studentId: submitters[j].id,
          content: `Submission by student — completed all required sections.`,
          marks,
          feedback: marks >= assignment.marks * 0.7 ? 'Byiza cyane / Well done!' : 'Gukomeza kwiga / Keep practicing.',
          submittedAt,
          gradedAt: new Date(),
        },
      });
      submissionCount++;
    }
  }

  console.log('\nSeed completed successfully!');
  console.log('═══════════════════════════════════════');
  console.log(`Students: ${studentRecords.length} | Teachers: ${teacherRecords.length} | Parents: ${parentRecords.length}`);
  console.log(`Books: ${books.length} | Active borrowings: 15 | Return history: 12 | Invoices: 20`);
  console.log(`Transport: ${vehicles.length} vehicles, 18 assignments | Hostel: ${hostelRooms.length} rooms, 20 residents`);
  console.log(`Health: ${clinicVisits.length} visits, ${medicines.length} medicines | HR: ${employeeDefs.length} employees, ${leaveDefs.length} leave requests`);
  console.log(`Inventory: ${assetDefs.length} assets, ${suppliers.length} suppliers | Timetable: ${classes.length * 5 * 6} slots`);
  console.log(`Learning: ${createdAssignments.length} assignments, ${submissionCount} submissions`);
  console.log(`Communication: ${messageDefs.length} messages, ${notificationDefs.length} notifications`);
  console.log('═══════════════════════════════════════');
  console.log('Login (password: Admin@123 for all):');
  console.log(`  Owner:     ${PROJECT_OWNER_EMAIL} (school owner, email OTP)`);
  console.log('  Admin:     admin@demoschool.edu');
  console.log('  Principal: principal@demoschool.edu');
  console.log('  Librarian: librarian@demoschool.edu');
  console.log('  Transport: transport@demoschool.edu');
  console.log('  Nurse:     nurse@demoschool.edu');
  console.log('  Teacher:   teacher1@demoschool.edu');
  console.log('  Parent:    faustin.niyonsaba@parent.rw');
  console.log('  Student:   student1@demoschool.edu (Jean Baptiste Niyonsaba)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
