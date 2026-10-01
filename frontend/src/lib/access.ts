/** Role-based navigation and portal access for EduSMS */

export type UserRole = string;

export const ADMIN_ROLES: UserRole[] = [
  'SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL', 'REGISTRAR',
];

export const STAFF_ROLES: UserRole[] = [
  ...ADMIN_ROLES, 'BURSAR', 'ACCOUNTANT', 'TEACHER', 'CLASS_TEACHER',
  'LIBRARIAN', 'TRANSPORT_MANAGER', 'NURSE', 'HR_OFFICER', 'RECEPTIONIST', 'SECURITY_OFFICER',
];

export interface NavItem {
  labelKey: string;
  path: string;
  icon: string;
  roles: UserRole[] | 'all';
}

export interface PortalDef {
  id: string;
  titleKey: string;
  descKey: string;
  path: string;
  roles: UserRole[];
  color: string;
}

export const PORTALS: PortalDef[] = [
  {
    id: 'library',
    titleKey: 'portals.library',
    descKey: 'portals.libraryDesc',
    path: '/admin/portals/library',
    roles: ['LIBRARIAN', ...ADMIN_ROLES],
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  },
  {
    id: 'parent',
    titleKey: 'portals.parent',
    descKey: 'portals.parentDesc',
    path: '/admin/portals/parent',
    roles: ['PARENT', ...ADMIN_ROLES],
    color: 'bg-blue-500/10 text-blue-700 border-blue-200',
  },
  {
    id: 'student',
    titleKey: 'portals.student',
    descKey: 'portals.studentDesc',
    path: '/admin/portals/student',
    roles: ['STUDENT', ...ADMIN_ROLES],
    color: 'bg-violet-500/10 text-violet-700 border-violet-200',
  },
  {
    id: 'teacher',
    titleKey: 'portals.teacher',
    descKey: 'portals.teacherDesc',
    path: '/admin/portals/teacher',
    roles: ['TEACHER', 'CLASS_TEACHER', ...ADMIN_ROLES],
    color: 'bg-amber-500/10 text-amber-700 border-amber-200',
  },
  {
    id: 'nurse',
    titleKey: 'portals.nurse',
    descKey: 'portals.nurseDesc',
    path: '/admin/portals/nurse',
    roles: ['NURSE', ...ADMIN_ROLES],
    color: 'bg-rose-500/10 text-rose-700 border-rose-200',
  },
  {
    id: 'transport',
    titleKey: 'portals.transport',
    descKey: 'portals.transportDesc',
    path: '/admin/portals/transport',
    roles: ['TRANSPORT_MANAGER', ...ADMIN_ROLES],
    color: 'bg-orange-500/10 text-orange-700 border-orange-200',
  },
  {
    id: 'finance',
    titleKey: 'portals.finance',
    descKey: 'portals.financeDesc',
    path: '/admin/portals/finance',
    roles: ['BURSAR', 'ACCOUNTANT', ...ADMIN_ROLES],
    color: 'bg-teal-500/10 text-teal-700 border-teal-200',
  },
  {
    id: 'hr',
    titleKey: 'portals.hr',
    descKey: 'portals.hrDesc',
    path: '/admin/portals/hr',
    roles: ['HR_OFFICER', ...ADMIN_ROLES],
    color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
  },
];

const NAV_ROLE_MAP: Record<string, UserRole[]> = {
  '/dashboard': [...STAFF_ROLES, 'STUDENT', 'PARENT', 'ALUMNI'],
  '/admin/portals': ADMIN_ROLES,
  '/admin/users': ADMIN_ROLES,
  '/students': [...ADMIN_ROLES, 'REGISTRAR', 'TEACHER', 'CLASS_TEACHER'],
  '/teachers': ADMIN_ROLES,
  '/academics': [...ADMIN_ROLES, 'REGISTRAR', 'TEACHER', 'CLASS_TEACHER'],
  '/attendance': [...ADMIN_ROLES, 'TEACHER', 'CLASS_TEACHER'],
  '/exams': [...ADMIN_ROLES, 'TEACHER', 'CLASS_TEACHER', 'REGISTRAR'],
  '/finance': [...ADMIN_ROLES, 'BURSAR', 'ACCOUNTANT'],
  '/library': [...ADMIN_ROLES, 'LIBRARIAN'],
  '/transport': [...ADMIN_ROLES, 'TRANSPORT_MANAGER'],
  '/hostel': ADMIN_ROLES,
  '/health': [...ADMIN_ROLES, 'NURSE'],
  '/hr': [...ADMIN_ROLES, 'HR_OFFICER'],
  '/inventory': ADMIN_ROLES,
  '/communication': STAFF_ROLES,
  '/timetable': [...STAFF_ROLES, 'STUDENT', 'PARENT'],
  '/learning': [...STAFF_ROLES, 'STUDENT'],
  '/ai': [...STAFF_ROLES, 'STUDENT', 'PARENT'],
  '/reports': ADMIN_ROLES,
  '/settings': ADMIN_ROLES,
};

export function canAccessRoute(role: UserRole | undefined, path: string): boolean {
  if (!role) return false;
  if (ADMIN_ROLES.includes(role)) return true;

  if (path.startsWith('/admin/portals/library')) {
    return PORTALS.find((p) => p.id === 'library')!.roles.includes(role);
  }
  if (path.startsWith('/admin/portals/parent')) {
    return PORTALS.find((p) => p.id === 'parent')!.roles.includes(role);
  }
  if (path.startsWith('/admin/portals/student')) {
    return PORTALS.find((p) => p.id === 'student')!.roles.includes(role);
  }
  if (path.startsWith('/admin/portals/teacher')) {
    return PORTALS.find((p) => p.id === 'teacher')!.roles.includes(role);
  }
  if (path.startsWith('/admin/portals/nurse')) {
    return PORTALS.find((p) => p.id === 'nurse')!.roles.includes(role);
  }
  if (path.startsWith('/admin/portals/transport')) {
    return PORTALS.find((p) => p.id === 'transport')!.roles.includes(role);
  }
  if (path.startsWith('/admin/portals/finance')) {
    return PORTALS.find((p) => p.id === 'finance')!.roles.includes(role);
  }
  if (path.startsWith('/admin/portals/hr')) {
    return PORTALS.find((p) => p.id === 'hr')!.roles.includes(role);
  }
  if (path.startsWith('/admin/portals')) {
    return ADMIN_ROLES.includes(role);
  }

  const base = '/' + path.split('/').filter(Boolean)[0];
  const allowed = NAV_ROLE_MAP[base];
  return allowed ? allowed.includes(role) : false;
}

export function getHomePath(role: UserRole | undefined): string {
  if (!role) return '/login';
  if (ADMIN_ROLES.includes(role)) return '/dashboard';
  switch (role) {
    case 'LIBRARIAN': return '/admin/portals/library';
    case 'PARENT': return '/admin/portals/parent';
    case 'STUDENT': return '/admin/portals/student';
    case 'TEACHER':
    case 'CLASS_TEACHER': return '/admin/portals/teacher';
    case 'NURSE': return '/admin/portals/nurse';
    case 'TRANSPORT_MANAGER': return '/admin/portals/transport';
    case 'BURSAR':
    case 'ACCOUNTANT': return '/admin/portals/finance';
    case 'HR_OFFICER': return '/admin/portals/hr';
    default: return '/dashboard';
  }
}

export function getAccessiblePortals(role: UserRole | undefined): PortalDef[] {
  if (!role) return [];
  return PORTALS.filter((p) => p.roles.includes(role));
}

export function canAccessNav(role: UserRole | undefined, path: string): boolean {
  return canAccessRoute(role, path);
}
