import type { LucideIcon } from 'lucide-react';
import {
  Upload, Download, FileText, Video, ClipboardCheck, Calendar, Wallet,
  Megaphone, Library, PlusCircle, Users, BookOpen,
} from 'lucide-react';
import type { UserRole } from './access';
import { ADMIN_ROLES } from './access';

export interface PortalShortcut {
  labelKey: string;
  descKey: string;
  path: string;
  icon: LucideIcon;
  tab?: string;
  view?: string;
  /** Query params e.g. action=create */
  query?: Record<string, string>;
}

const STUDENT_PORTAL = '/admin/portals/student';
const TEACHER_PORTAL = '/admin/portals/teacher';

function link(path: string, tab?: string, query?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  if (query) Object.entries(query).forEach(([k, v]) => params.set(k, v));
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

const STUDENT_SHORTCUTS: PortalShortcut[] = [
  { labelKey: 'shortcuts.submitAssignment', descKey: 'shortcuts.submitAssignmentDesc', path: STUDENT_PORTAL, icon: Upload, tab: 'assignments' },
  { labelKey: 'shortcuts.downloadMaterials', descKey: 'shortcuts.downloadMaterialsDesc', path: STUDENT_PORTAL, icon: Download, tab: 'assignments' },
  { labelKey: 'shortcuts.examResults', descKey: 'shortcuts.examResultsDesc', path: STUDENT_PORTAL, icon: FileText, tab: 'results' },
  { labelKey: 'shortcuts.myTimetable', descKey: 'shortcuts.myTimetableDesc', path: STUDENT_PORTAL, icon: Calendar, tab: 'timetable' },
  { labelKey: 'shortcuts.myFees', descKey: 'shortcuts.myFeesDesc', path: STUDENT_PORTAL, icon: Wallet, tab: 'fees' },
  { labelKey: 'shortcuts.announcements', descKey: 'shortcuts.announcementsDesc', path: STUDENT_PORTAL, icon: Megaphone, tab: 'announcements' },
];

const TEACHER_SHORTCUTS: PortalShortcut[] = [
  { labelKey: 'shortcuts.createAssignment', descKey: 'shortcuts.createAssignmentDesc', path: '/learning', icon: PlusCircle, query: { action: 'create' } },
  { labelKey: 'shortcuts.manageAssignments', descKey: 'shortcuts.manageAssignmentsDesc', path: '/learning', icon: Video },
  { labelKey: 'shortcuts.markAttendance', descKey: 'shortcuts.markAttendanceDesc', path: '/attendance', icon: ClipboardCheck },
  { labelKey: 'shortcuts.enterMarks', descKey: 'shortcuts.enterMarksDesc', path: '/exams', icon: BookOpen },
  { labelKey: 'shortcuts.viewStudents', descKey: 'shortcuts.viewStudentsDesc', path: '/students', icon: Users },
  { labelKey: 'shortcuts.teacherPortal', descKey: 'shortcuts.teacherPortalDesc', path: TEACHER_PORTAL, icon: Library },
];

const PARENT_SHORTCUTS: PortalShortcut[] = [
  { labelKey: 'parent.assignments', descKey: 'shortcuts.downloadMaterialsDesc', path: '/admin/portals/parent', icon: Download, view: 'assignments' },
  { labelKey: 'parent.results', descKey: 'shortcuts.examResultsDesc', path: '/admin/portals/parent', icon: FileText, view: 'results' },
  { labelKey: 'parent.attendance', descKey: 'shortcuts.markAttendanceDesc', path: '/admin/portals/parent', icon: ClipboardCheck, view: 'attendance' },
  { labelKey: 'parent.fees', descKey: 'shortcuts.myFeesDesc', path: '/admin/portals/parent', icon: Wallet, view: 'fees' },
];

export function getPortalShortcuts(role: UserRole | undefined): PortalShortcut[] {
  if (!role || ADMIN_ROLES.includes(role)) return [];
  if (role === 'STUDENT') return STUDENT_SHORTCUTS;
  if (role === 'TEACHER' || role === 'CLASS_TEACHER') return TEACHER_SHORTCUTS;
  if (role === 'PARENT') return PARENT_SHORTCUTS;
  return [];
}

export function buildShortcutLink(item: PortalShortcut): string {
  return link(item.path, item.tab, item.query);
}
