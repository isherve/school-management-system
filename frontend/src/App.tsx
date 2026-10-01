import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoginPage } from '@/pages/auth/login';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password';
import { ResetPasswordPage } from '@/pages/auth/reset-password';
import { RequestAccountPage } from '@/pages/auth/request-account';
import { NotFoundPage } from '@/pages/not-found';
import { RoleRoute } from '@/components/auth/role-route';
import { useAuthStore } from '@/stores';
import { getHomePath } from '@/lib/access';

const DashboardPage = lazy(() => import('@/pages/dashboard/index').then(m => ({ default: m.DashboardPage })));
const StudentsPage = lazy(() => import('@/pages/students/index').then(m => ({ default: m.StudentsPage })));
const TeachersPage = lazy(() => import('@/pages/teachers/index').then(m => ({ default: m.TeachersPage })));
const ExamsPage = lazy(() => import('@/pages/exams/index').then(m => ({ default: m.ExamsPage })));
const FinancePage = lazy(() => import('@/pages/finance/index').then(m => ({ default: m.FinancePage })));
const ParentPortalPage = lazy(() => import('@/pages/parent/index').then(m => ({ default: m.ParentPortalPage })));
const AIPage = lazy(() => import('@/pages/ai/index').then(m => ({ default: m.AIPage })));
const ReportsPage = lazy(() => import('@/pages/reports/index').then(m => ({ default: m.ReportsPage })));
const AttendancePage = lazy(() => import('@/pages/attendance/index').then(m => ({ default: m.AttendancePage })));
const AcademicsPage = lazy(() => import('@/pages/academics/index').then(m => ({ default: m.AcademicsPage })));
const SettingsPage = lazy(() => import('@/pages/settings/index').then(m => ({ default: m.SettingsPage })));
const CommunicationPage = lazy(() => import('@/pages/communication/index').then(m => ({ default: m.CommunicationPage })));
const LibraryPage = lazy(() => import('@/pages/library/index').then(m => ({ default: m.LibraryPage })));
const TransportPage = lazy(() => import('@/pages/transport/index').then(m => ({ default: m.TransportPage })));
const HostelPage = lazy(() => import('@/pages/hostel/index').then(m => ({ default: m.HostelPage })));
const HealthPage = lazy(() => import('@/pages/health/index').then(m => ({ default: m.HealthPage })));
const HRPage = lazy(() => import('@/pages/hr/index').then(m => ({ default: m.HRPage })));
const InventoryPage = lazy(() => import('@/pages/inventory/index').then(m => ({ default: m.InventoryPage })));
const TimetablePage = lazy(() => import('@/pages/timetable/index').then(m => ({ default: m.TimetablePage })));
const LearningPage = lazy(() => import('@/pages/learning/index').then(m => ({ default: m.LearningPage })));
const AdminUsersPage = lazy(() => import('@/pages/admin/users').then(m => ({ default: m.AdminUsersPage })));
const AdminPortalsPage = lazy(() => import('@/pages/admin/portals/index').then(m => ({ default: m.AdminPortalsPage })));
const StudentPortalPage = lazy(() => import('@/pages/admin/portals/student').then(m => ({ default: m.StudentPortalPage })));
const TeacherPortalPage = lazy(() => import('@/pages/admin/portals/teacher').then(m => ({ default: m.TeacherPortalPage })));
const NursePortalPage = lazy(() => import('@/pages/admin/portals/nurse').then(m => ({ default: m.NursePortalPage })));
const TransportPortalPage = lazy(() => import('@/pages/admin/portals/transport').then(m => ({ default: m.TransportPortalPage })));
const FinancePortalPage = lazy(() => import('@/pages/admin/portals/finance').then(m => ({ default: m.FinancePortalPage })));
const HRPortalPage = lazy(() => import('@/pages/admin/portals/hr').then(m => ({ default: m.HRPortalPage })));
const LibraryPortalDashboard = lazy(() => import('@/pages/library-portal/index').then(m => ({ default: m.LibraryPortalDashboard })));
const LibraryPortalBooksPage = lazy(() => import('@/pages/library-portal/books').then(m => ({ default: m.LibraryPortalBooksPage })));
const LibraryPortalBorrowingsPage = lazy(() => import('@/pages/library-portal/borrowings').then(m => ({ default: m.LibraryPortalBorrowingsPage })));
const LibraryPortalHistoryPage = lazy(() => import('@/pages/library-portal/history').then(m => ({ default: m.LibraryPortalHistoryPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to={getHomePath(user?.role)} replace />;
  }
  return <>{children}</>;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}

function R({ path, children }: { path: string; children: React.ReactNode }) {
  return <RoleRoute path={path}><Lazy>{children}</Lazy></RoleRoute>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/request-account" element={<GuestRoute><RequestAccountPage /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<R path="/dashboard"><DashboardPage /></R>} />
            <Route path="students/*" element={<R path="/students"><StudentsPage /></R>} />
            <Route path="teachers/*" element={<R path="/teachers"><TeachersPage /></R>} />
            <Route path="academics" element={<R path="/academics"><AcademicsPage /></R>} />
            <Route path="attendance" element={<R path="/attendance"><AttendancePage /></R>} />
            <Route path="exams/*" element={<R path="/exams"><ExamsPage /></R>} />
            <Route path="finance/*" element={<R path="/finance"><FinancePage /></R>} />
            <Route path="library" element={<R path="/library"><LibraryPage /></R>} />
            <Route path="transport" element={<R path="/transport"><TransportPage /></R>} />
            <Route path="hostel" element={<R path="/hostel"><HostelPage /></R>} />
            <Route path="health" element={<R path="/health"><HealthPage /></R>} />
            <Route path="hr" element={<R path="/hr"><HRPage /></R>} />
            <Route path="inventory" element={<R path="/inventory"><InventoryPage /></R>} />
            <Route path="communication" element={<R path="/communication"><CommunicationPage /></R>} />
            <Route path="timetable" element={<R path="/timetable"><TimetablePage /></R>} />
            <Route path="learning" element={<R path="/learning"><LearningPage /></R>} />
            <Route path="ai/*" element={<R path="/ai"><AIPage /></R>} />
            <Route path="reports/*" element={<R path="/reports"><ReportsPage /></R>} />
            <Route path="admin/users" element={<R path="/admin/users"><AdminUsersPage /></R>} />
            <Route path="admin/portals" element={<R path="/admin/portals"><AdminPortalsPage /></R>} />
            <Route path="admin/portals/library" element={<R path="/admin/portals/library"><LibraryPortalDashboard /></R>} />
            <Route path="admin/portals/library/books" element={<R path="/admin/portals/library"><LibraryPortalBooksPage /></R>} />
            <Route path="admin/portals/library/borrowings" element={<R path="/admin/portals/library"><LibraryPortalBorrowingsPage /></R>} />
            <Route path="admin/portals/library/history" element={<R path="/admin/portals/library"><LibraryPortalHistoryPage /></R>} />
            <Route path="admin/portals/parent" element={<R path="/admin/portals/parent"><ParentPortalPage /></R>} />
            <Route path="admin/portals/student" element={<R path="/admin/portals/student"><StudentPortalPage /></R>} />
            <Route path="admin/portals/teacher" element={<R path="/admin/portals/teacher"><TeacherPortalPage /></R>} />
            <Route path="admin/portals/nurse" element={<R path="/admin/portals/nurse"><NursePortalPage /></R>} />
            <Route path="admin/portals/transport" element={<R path="/admin/portals/transport"><TransportPortalPage /></R>} />
            <Route path="admin/portals/finance" element={<R path="/admin/portals/finance"><FinancePortalPage /></R>} />
            <Route path="admin/portals/hr" element={<R path="/admin/portals/hr"><HRPortalPage /></R>} />
            <Route path="settings" element={<R path="/settings"><SettingsPage /></R>} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/library-portal/*" element={<Navigate to="/admin/portals/library" replace />} />
          <Route path="/parent/*" element={<Navigate to="/admin/portals/parent" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
