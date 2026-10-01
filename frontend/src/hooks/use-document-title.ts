import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/i18n';

const PATH_TITLE_KEYS: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/students': 'nav.students',
  '/teachers': 'nav.teachers',
  '/academics': 'nav.academics',
  '/attendance': 'nav.attendance',
  '/exams': 'nav.examinations',
  '/finance': 'nav.finance',
  '/library': 'nav.library',
  '/transport': 'nav.transport',
  '/hostel': 'nav.hostel',
  '/health': 'nav.health',
  '/hr': 'nav.hr',
  '/inventory': 'nav.inventory',
  '/communication': 'nav.communication',
  '/timetable': 'nav.timetable',
  '/learning': 'nav.onlineLearning',
  '/ai': 'nav.aiTools',
  '/reports': 'nav.reports',
  '/settings': 'nav.settings',
  '/admin/users': 'nav.userManagement',
  '/admin/portals': 'portals.title',
};

export function useDocumentTitle() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const base = 'EduSMS';
    const match = Object.entries(PATH_TITLE_KEYS).find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
    const section = match ? t(match[1]) : null;
    document.title = section ? `${section} · ${base}` : base;
  }, [pathname, t]);
}
