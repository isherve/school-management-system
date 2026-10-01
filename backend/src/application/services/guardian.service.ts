import { Prisma } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError, ValidationError } from '../../shared/errors/app.error.js';

type DbClient = Prisma.TransactionClient | typeof prisma;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getParentProfileByEmail(schoolId: string, email: string, client: DbClient = prisma) {
  const user = await client.user.findFirst({
    where: { email: normalizeEmail(email), schoolId, role: 'PARENT' },
    include: { parent: true },
  });
  if (!user?.parent) return null;
  return user.parent;
}

export async function linkStudentToParent(
  schoolId: string,
  studentId: string,
  parentId: string,
  relationship: string,
  isPrimary = false,
  client: DbClient = prisma
) {
  const student = await client.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) throw new NotFoundError('Student');

  const parent = await client.parent.findUnique({
    where: { id: parentId },
    include: { user: { select: { schoolId: true } } },
  });
  if (!parent || parent.user.schoolId !== schoolId) throw new NotFoundError('Parent');

  const rel = relationship.trim() || 'Parent';

  await client.studentGuardian.upsert({
    where: { studentId_parentId: { studentId, parentId } },
    create: { studentId, parentId, relationship: rel, isPrimary, canPickup: true },
    update: { relationship: rel, ...(isPrimary ? { isPrimary: true } : {}) },
  });
}

export async function linkStudentToParentByEmail(
  schoolId: string,
  studentId: string,
  parentEmail: string,
  relationship: string,
  isPrimary = false,
  client: DbClient = prisma
) {
  const parent = await getParentProfileByEmail(schoolId, parentEmail, client);
  if (!parent) {
    throw new ValidationError(
      `No parent account found for email "${parentEmail}". Create the parent user first, then link.`
    );
  }
  await linkStudentToParent(schoolId, studentId, parent.id, relationship, isPrimary, client);
}

export async function linkParentToStudents(
  schoolId: string,
  parentId: string,
  studentIds: string[],
  relationship = 'Parent',
  client: DbClient = prisma
) {
  const uniqueIds = [...new Set(studentIds.filter(Boolean))];
  for (const studentId of uniqueIds) {
    await linkStudentToParent(schoolId, studentId, parentId, relationship, false, client);
  }
}

export async function linkParentToStudentByAdmissionNumber(
  schoolId: string,
  parentId: string,
  admissionNumber: string,
  relationship = 'Parent',
  client: DbClient = prisma
) {
  const trimmed = admissionNumber.trim();
  if (!trimmed) throw new ValidationError('Student admission number is required to link parent');

  const student = await client.student.findFirst({
    where: { schoolId, admissionNumber: trimmed },
  });
  if (!student) {
    throw new NotFoundError(`Student with admission number "${trimmed}"`);
  }

  await linkStudentToParent(schoolId, student.id, parentId, relationship, true, client);
}
