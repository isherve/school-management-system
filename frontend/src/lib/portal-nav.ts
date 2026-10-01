import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, FileText, ClipboardCheck, Wallet, Video, Calendar,
  Library, Bus, Megaphone, Users, BookOpen, BookMarked, History, Heart, Pill,
  Briefcase, CalendarOff, DollarSign, Upload, Download, PlusCircle, Brain,
} from 'lucide-react';
import { ADMIN_ROLES, STAFF_ROLES, type UserRole } from './access';

export interface SidebarNavEntry {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  /** Match ?tab= on portal pages */
  tab?: string;
  /** Match ?view= on parent portal */
  view?: string;
  /** Extra query params (e.g. action=create) */
  query?: Record<string, string>;
  roles: UserRole[];
  /** Section header shown above this item (when changed from previous) */
  sectionKey?: string;
}

const STUDENT_PORTAL = '/admin/portals/student';
const PARENT_PORTAL = '/admin/portals/parent';
const TEACHER_PORTAL = '/admin/portals/teacher';
const LIBRARY_PORTAL = '/admin/portals/library';
const NURSE_PORTAL = '/admin/portals/nurse';
const TRANSPORT_PORTAL = '/admin/portals/transport';
const FINANCE_PORTAL = '/admin/portals/finance';
const HR_PORTAL = '/admin/portals/hr';

export const PORTAL_SIDEBAR_ITEMS: SidebarNavEntry[] = [
  // Student
  { labelKey: 'portals.studentPortal.overview', path: STUDENT_PORTAL, icon: LayoutDashboard, tab: 'overview', roles: ['STUDENT', ...ADMIN_ROLES], sectionKey: 'nav.myPortal' },
  { labelKey: 'portals.studentPortal.examResults', path: STUDENT_PORTAL, icon: FileText, tab: 'results', roles: ['STUDENT', ...ADMIN_ROLES] },
  { labelKey: 'portals.studentPortal.myAttendance', path: STUDENT_PORTAL, icon: ClipboardCheck, tab: 'attendance', roles: ['STUDENT', ...ADMIN_ROLES] },
  { labelKey: 'portals.studentPortal.myFees', path: STUDENT_PORTAL, icon: Wallet, tab: 'fees', roles: ['STUDENT', ...ADMIN_ROLES] },
  { labelKey: 'portals.studentPortal.myAssignments', path: STUDENT_PORTAL, icon: Video, tab: 'assignments', roles: ['STUDENT', ...ADMIN_ROLES] },
  { labelKey: 'shortcuts.submitAssignment', path: STUDENT_PORTAL, icon: Upload, tab: 'assignments', roles: ['STUDENT', ...ADMIN_ROLES] },
  { labelKey: 'shortcuts.downloadMaterials', path: STUDENT_PORTAL, icon: Download, tab: 'assignments', roles: ['STUDENT', ...ADMIN_ROLES] },
  { labelKey: 'portals.studentPortal.myTimetable', path: STUDENT_PORTAL, icon: Calendar, tab: 'timetable', roles: ['STUDENT', ...ADMIN_ROLES] },
  { labelKey: 'portals.studentPortal.myLibrary', path: STUDENT_PORTAL, icon: Library, tab: 'library', roles: ['STUDENT', ...ADMIN_ROLES] },
  { labelKey: 'portals.studentPortal.myTransport', path: STUDENT_PORTAL, icon: Bus, tab: 'transport', roles: ['STUDENT', ...ADMIN_ROLES] },
  { labelKey: 'portals.studentPortal.announcements', path: STUDENT_PORTAL, icon: Megaphone, tab: 'announcements', roles: ['STUDENT', ...ADMIN_ROLES] },
  { labelKey: 'nav.aiTools', path: '/ai', icon: Brain, roles: ['STUDENT'] },

  // Parent
  { labelKey: 'parent.title', path: PARENT_PORTAL, icon: Users, roles: ['PARENT', ...ADMIN_ROLES], sectionKey: 'nav.myPortal' },
  { labelKey: 'parent.attendance', path: PARENT_PORTAL, icon: ClipboardCheck, view: 'attendance', roles: ['PARENT', ...ADMIN_ROLES] },
  { labelKey: 'parent.results', path: PARENT_PORTAL, icon: FileText, view: 'results', roles: ['PARENT', ...ADMIN_ROLES] },
  { labelKey: 'parent.fees', path: PARENT_PORTAL, icon: Wallet, view: 'fees', roles: ['PARENT', ...ADMIN_ROLES] },
  { labelKey: 'parent.timetable', path: PARENT_PORTAL, icon: Calendar, view: 'timetable', roles: ['PARENT', ...ADMIN_ROLES] },
  { labelKey: 'parent.assignments', path: PARENT_PORTAL, icon: Video, view: 'assignments', roles: ['PARENT', ...ADMIN_ROLES] },
  { labelKey: 'parent.library', path: PARENT_PORTAL, icon: Library, view: 'library', roles: ['PARENT', ...ADMIN_ROLES] },
  { labelKey: 'parent.transport', path: PARENT_PORTAL, icon: Bus, view: 'transport', roles: ['PARENT', ...ADMIN_ROLES] },
  { labelKey: 'parent.announcements', path: PARENT_PORTAL, icon: Megaphone, view: 'announcements', roles: ['PARENT', ...ADMIN_ROLES] },
  { labelKey: 'nav.aiTools', path: '/ai', icon: Brain, roles: ['PARENT'] },

  // Teacher
  { labelKey: 'portals.teacher', path: TEACHER_PORTAL, icon: Briefcase, roles: ['TEACHER', 'CLASS_TEACHER', ...ADMIN_ROLES], sectionKey: 'nav.myPortal' },
  { labelKey: 'nav.attendance', path: '/attendance', icon: ClipboardCheck, roles: ['TEACHER', 'CLASS_TEACHER', ...ADMIN_ROLES] },
  { labelKey: 'nav.examinations', path: '/exams', icon: FileText, roles: ['TEACHER', 'CLASS_TEACHER', ...ADMIN_ROLES] },
  { labelKey: 'nav.onlineLearning', path: '/learning', icon: Video, roles: ['TEACHER', 'CLASS_TEACHER', ...ADMIN_ROLES] },
  { labelKey: 'shortcuts.createAssignment', path: '/learning', icon: PlusCircle, query: { action: 'create' }, roles: ['TEACHER', 'CLASS_TEACHER', ...ADMIN_ROLES] },
  { labelKey: 'shortcuts.manageAssignments', path: '/learning', icon: Upload, roles: ['TEACHER', 'CLASS_TEACHER', ...ADMIN_ROLES] },
  { labelKey: 'nav.timetable', path: '/timetable', icon: Calendar, roles: ['TEACHER', 'CLASS_TEACHER', ...ADMIN_ROLES] },
  { labelKey: 'nav.students', path: '/students', icon: Users, roles: ['TEACHER', 'CLASS_TEACHER', ...ADMIN_ROLES] },
  { labelKey: 'nav.aiTools', path: '/ai', icon: Brain, roles: ['TEACHER', 'CLASS_TEACHER'] },

  // Librarian
  { labelKey: 'portals.library', path: LIBRARY_PORTAL, icon: Library, roles: ['LIBRARIAN', ...ADMIN_ROLES], sectionKey: 'nav.myPortal' },
  { labelKey: 'libraryNav.books', path: `${LIBRARY_PORTAL}/books`, icon: BookOpen, roles: ['LIBRARIAN', ...ADMIN_ROLES] },
  { labelKey: 'libraryNav.borrowings', path: `${LIBRARY_PORTAL}/borrowings`, icon: BookMarked, roles: ['LIBRARIAN', ...ADMIN_ROLES] },
  { labelKey: 'libraryNav.history', path: `${LIBRARY_PORTAL}/history`, icon: History, roles: ['LIBRARIAN', ...ADMIN_ROLES] },
  { labelKey: 'nav.aiTools', path: '/ai', icon: Brain, roles: ['LIBRARIAN'] },

  // Nurse
  { labelKey: 'portals.nurse', path: NURSE_PORTAL, icon: Heart, tab: 'visits', roles: ['NURSE', ...ADMIN_ROLES], sectionKey: 'nav.myPortal' },
  { labelKey: 'health.medicineInventory', path: NURSE_PORTAL, icon: Pill, tab: 'medicine', roles: ['NURSE', ...ADMIN_ROLES] },
  { labelKey: 'nav.aiTools', path: '/ai', icon: Brain, roles: ['NURSE'] },

  // Transport
  { labelKey: 'portals.transport', path: TRANSPORT_PORTAL, icon: Bus, tab: 'fleet', roles: ['TRANSPORT_MANAGER', ...ADMIN_ROLES], sectionKey: 'nav.myPortal' },
  { labelKey: 'portals.transportPortal.assignments', path: TRANSPORT_PORTAL, icon: Users, tab: 'assignments', roles: ['TRANSPORT_MANAGER', ...ADMIN_ROLES] },
  { labelKey: 'nav.aiTools', path: '/ai', icon: Brain, roles: ['TRANSPORT_MANAGER'] },

  // Finance
  { labelKey: 'portals.finance', path: FINANCE_PORTAL, icon: DollarSign, roles: ['BURSAR', 'ACCOUNTANT', ...ADMIN_ROLES], sectionKey: 'nav.myPortal' },
  { labelKey: 'nav.finance', path: '/finance', icon: DollarSign, roles: ['BURSAR', 'ACCOUNTANT', ...ADMIN_ROLES] },
  { labelKey: 'nav.aiTools', path: '/ai', icon: Brain, roles: ['BURSAR', 'ACCOUNTANT'] },

  // HR
  { labelKey: 'portals.hr', path: HR_PORTAL, icon: Briefcase, tab: 'employees', roles: ['HR_OFFICER', ...ADMIN_ROLES], sectionKey: 'nav.myPortal' },
  { labelKey: 'portals.hrPortal.employees', path: HR_PORTAL, icon: Users, tab: 'employees', roles: ['HR_OFFICER', ...ADMIN_ROLES] },
  { labelKey: 'portals.hrPortal.leaveRequests', path: HR_PORTAL, icon: CalendarOff, tab: 'leave', roles: ['HR_OFFICER', ...ADMIN_ROLES] },
  { labelKey: 'nav.aiTools', path: '/ai', icon: Brain, roles: ['HR_OFFICER'] },
];

const ROLE_PRIMARY_PORTAL: Partial<Record<UserRole, UserRole[]>> = {
  STUDENT: ['STUDENT'],
  PARENT: ['PARENT'],
  TEACHER: ['TEACHER', 'CLASS_TEACHER'],
  CLASS_TEACHER: ['TEACHER', 'CLASS_TEACHER'],
  LIBRARIAN: ['LIBRARIAN'],
  NURSE: ['NURSE'],
  TRANSPORT_MANAGER: ['TRANSPORT_MANAGER'],
  BURSAR: ['BURSAR', 'ACCOUNTANT'],
  ACCOUNTANT: ['BURSAR', 'ACCOUNTANT'],
  HR_OFFICER: ['HR_OFFICER'],
};

/** Portal-focused sidebar for non-admin role users */
export function getPortalSidebarItems(role: UserRole | undefined): SidebarNavEntry[] {
  if (!role) return [];
  if (ADMIN_ROLES.includes(role)) return [];

  const roleTags = ROLE_PRIMARY_PORTAL[role] || [role];
  const seen = new Set<string>();

  return PORTAL_SIDEBAR_ITEMS.filter((item) => {
    if (!item.roles.some((r) => roleTags.includes(r) || r === role)) return false;
    const key = `${item.labelKey}|${item.path}|${item.tab || ''}|${item.view || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function usesPortalSidebar(role: UserRole | undefined): boolean {
  if (!role) return false;
  return !ADMIN_ROLES.includes(role) && getPortalSidebarItems(role).length > 0;
}

export function buildPortalLink(item: SidebarNavEntry): string {
  const params = new URLSearchParams();
  if (item.tab) params.set('tab', item.tab);
  if (item.view) params.set('view', item.view);
  if (item.query) Object.entries(item.query).forEach(([k, v]) => params.set(k, v));
  const qs = params.toString();
  return qs ? `${item.path}?${qs}` : item.path;
}

export function isPortalNavActive(item: SidebarNavEntry, pathname: string, search: string): boolean {
  const basePath = item.path.split('?')[0];
  const params = new URLSearchParams(search);

  if (item.tab || item.view) {
    if (!pathname.startsWith(basePath)) return false;
    if (item.tab) return (params.get('tab') || 'overview') === item.tab;
    if (item.view) return params.get('view') === item.view;
  }

  // Parent portal home (no view param)
  if (basePath === PARENT_PORTAL && !item.view) {
    return pathname.startsWith(PARENT_PORTAL) && !params.get('view');
  }

  // Path-only routes
  if (!item.tab && !item.view) {
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  }

  return false;
}

/** Admin users on a portal route get contextual sub-nav */
export function getAdminPortalContextNav(pathname: string, _search: string, role: UserRole | undefined): SidebarNavEntry[] {
  if (!role || !ADMIN_ROLES.includes(role)) return [];

  if (pathname.startsWith('/admin/portals/student')) {
    return PORTAL_SIDEBAR_ITEMS.filter((i) => i.path === STUDENT_PORTAL && i.roles.includes('STUDENT'));
  }
  if (pathname.startsWith('/admin/portals/parent')) {
    return PORTAL_SIDEBAR_ITEMS.filter((i) => i.path === PARENT_PORTAL && i.roles.includes('PARENT'));
  }
  if (pathname.startsWith('/admin/portals/library')) {
    return PORTAL_SIDEBAR_ITEMS.filter((i) => i.path.startsWith(LIBRARY_PORTAL) && i.roles.includes('LIBRARIAN'));
  }
  if (pathname.startsWith('/admin/portals/nurse') || pathname.startsWith('/health')) {
    return PORTAL_SIDEBAR_ITEMS.filter((i) => i.path === NURSE_PORTAL && i.roles.includes('NURSE'));
  }
  if (pathname.startsWith('/admin/portals/transport') || pathname.startsWith('/transport')) {
    return PORTAL_SIDEBAR_ITEMS.filter((i) => i.path === TRANSPORT_PORTAL && i.roles.includes('TRANSPORT_MANAGER'));
  }
  if (pathname.startsWith('/admin/portals/hr') || pathname.startsWith('/hr')) {
    return PORTAL_SIDEBAR_ITEMS.filter((i) => i.path === HR_PORTAL && i.roles.includes('HR_OFFICER'));
  }
  if (pathname.startsWith('/admin/portals/teacher')) {
    return PORTAL_SIDEBAR_ITEMS.filter((i) => (i.path === TEACHER_PORTAL || i.path.startsWith('/')) && i.roles.includes('TEACHER') && !i.tab);
  }

  return [];
}

export { STAFF_ROLES };
