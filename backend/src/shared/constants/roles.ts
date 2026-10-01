import { UserRole } from '@prisma/client';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  SCHOOL_OWNER: 90,
  PRINCIPAL: 80,
  VICE_PRINCIPAL: 75,
  REGISTRAR: 70,
  BURSAR: 70,
  ACCOUNTANT: 65,
  HR_OFFICER: 65,
  TEACHER: 50,
  CLASS_TEACHER: 55,
  LIBRARIAN: 45,
  TRANSPORT_MANAGER: 45,
  NURSE: 45,
  RECEPTIONIST: 40,
  SECURITY_OFFICER: 35,
  PARENT: 20,
  STUDENT: 10,
  ALUMNI: 5,
};

export const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_OWNER,
  UserRole.PRINCIPAL,
  UserRole.VICE_PRINCIPAL,
];

export const STAFF_ROLES: UserRole[] = [
  ...ADMIN_ROLES,
  UserRole.REGISTRAR,
  UserRole.BURSAR,
  UserRole.ACCOUNTANT,
  UserRole.TEACHER,
  UserRole.CLASS_TEACHER,
  UserRole.LIBRARIAN,
  UserRole.TRANSPORT_MANAGER,
  UserRole.NURSE,
  UserRole.HR_OFFICER,
  UserRole.RECEPTIONIST,
  UserRole.SECURITY_OFFICER,
];

export const MODULE_PERMISSIONS = {
  students: ['create', 'read', 'update', 'delete', 'promote', 'transfer'],
  teachers: ['create', 'read', 'update', 'delete'],
  attendance: ['create', 'read', 'update', 'report'],
  exams: ['create', 'read', 'update', 'delete', 'publish', 'approve'],
  finance: ['create', 'read', 'update', 'delete', 'approve'],
  library: ['create', 'read', 'update', 'delete'],
  transport: ['create', 'read', 'update', 'delete'],
  hostel: ['create', 'read', 'update', 'delete'],
  hr: ['create', 'read', 'update', 'delete'],
  settings: ['read', 'update'],
  reports: ['read', 'export'],
  ai: ['use'],
} as const;

export function hasRoleAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}
