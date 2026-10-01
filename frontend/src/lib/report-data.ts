import {
  studentApi, teacherApi, examApi, financeApi, attendanceApi,
  libraryApi, modulesApi,
} from '@/services/endpoints';

export type ReportId =
  | 'student' | 'attendance' | 'financial' | 'academic' | 'teacher'
  | 'library' | 'transport' | 'health' | 'inventory';

export async function loadReportTable(id: ReportId): Promise<{ headers: string[]; rows: string[][]; title: string }> {
  switch (id) {
    case 'student': {
      const [stats, list] = await Promise.all([
        studentApi.getStats(),
        studentApi.getAll({ limit: '100' }),
      ]);
      const students = list?.data || list || [];
      const rows: string[][] = [
        ['Total students', String(stats?.total ?? stats?.active ?? '—')],
        ['Active', String(stats?.active ?? '—')],
      ];
      (students as { admissionNumber?: string; user?: { firstName: string; lastName: string }; class?: { name: string } }[])
        .slice(0, 40)
        .forEach((s) => {
          rows.push([
            `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim(),
            s.admissionNumber || '—',
            s.class?.name || '—',
          ]);
        });
      return {
        title: 'Student Report',
        headers: ['Name / Metric', 'Admission / Value', 'Class'],
        rows,
      };
    }
    case 'attendance': {
      const stats = await attendanceApi.getStats();
      const report = await attendanceApi.getReport({ limit: '50' });
      const rows: string[][] = [
        ['Present today', String(stats?.present ?? '—')],
        ['Absent today', String(stats?.absent ?? '—')],
        ['Rate', `${stats?.rate ?? stats?.attendanceRate ?? '—'}%`],
      ];
      (report as { date?: string; present?: number; absent?: number }[] || []).slice(0, 20).forEach((r) => {
        rows.push([String(r.date || '—'), String(r.present ?? '—'), String(r.absent ?? '—')]);
      });
      return { title: 'Attendance Report', headers: ['Date / Summary', 'Present', 'Absent'], rows };
    }
    case 'financial': {
      const [summary, invoices] = await Promise.all([
        financeApi.getSummary(),
        financeApi.getInvoices({ limit: '40' }),
      ]);
      const inv = invoices?.data || invoices || [];
      const rows: string[][] = [
        ['Total collected', '—', String(summary?.totalCollected ?? summary?.collected ?? '—'), '—'],
        ['Outstanding', '—', String(summary?.totalOutstanding ?? summary?.outstanding ?? '—'), '—'],
      ];
      (inv as { invoiceNumber?: string; status?: string; totalAmount?: number; student?: { user?: { firstName: string; lastName: string } } }[])
        .forEach((i) => {
          rows.push([
            i.invoiceNumber || '—',
            `${i.student?.user?.firstName || ''} ${i.student?.user?.lastName || ''}`.trim(),
            String(i.totalAmount ?? '—'),
            i.status || '—',
          ]);
        });
      return { title: 'Financial Report', headers: ['Invoice / Metric', 'Student / Value', 'Amount', 'Status'], rows };
    }
    case 'academic': {
      const exams = await examApi.getAll({ limit: '30' });
      const list = exams?.data || exams || [];
      const rows = (list as { name: string; subject?: { name: string }; isPublished?: boolean; examDate?: string }[]).map((e) => [
        e.name,
        e.subject?.name || '—',
        e.isPublished ? 'Published' : 'Draft',
        e.examDate ? new Date(e.examDate).toLocaleDateString() : '—',
      ]);
      return { title: 'Academic Report', headers: ['Exam', 'Subject', 'Status', 'Date'], rows };
    }
    case 'teacher': {
      const [stats, list] = await Promise.all([teacherApi.getStats(), teacherApi.getAll({ limit: '50' })]);
      const teachers = list?.data || list || [];
      const rows: string[][] = [
        ['Total teachers', String(stats?.total ?? stats?.active ?? '—')],
      ];
      (teachers as { employeeId?: string; user?: { firstName: string; lastName: string }; department?: { name: string } }[])
        .forEach((t) => {
          rows.push([
            `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim(),
            t.employeeId || '—',
            t.department?.name || '—',
          ]);
        });
      return { title: 'Teacher Report', headers: ['Name / Metric', 'Employee ID', 'Department'], rows };
    }
    case 'library': {
      const [stats, books] = await Promise.all([
        libraryApi.getStats(),
        libraryApi.getBooks({ limit: '40' }),
      ]);
      const bookList = books?.data || books || [];
      const rows: string[][] = [
        ['Total books', String(stats?.totalBooks ?? '—')],
        ['Available', String(stats?.available ?? '—')],
        ['Borrowed', String(stats?.borrowed ?? stats?.activeBorrowings ?? '—')],
      ];
      (bookList as { title: string; author?: string; availableCopies?: number }[]).slice(0, 25).forEach((b) => {
        rows.push([b.title, b.author || '—', String(b.availableCopies ?? '—')]);
      });
      return { title: 'Library Report', headers: ['Title / Metric', 'Author', 'Available'], rows };
    }
    case 'transport': {
      const [stats, assignments] = await Promise.all([
        modulesApi.transport.getStats(),
        modulesApi.transport.getAssignments(),
      ]);
      const rows: string[][] = [
        ['Vehicles', String(stats?.totalVehicles ?? stats?.vehicles ?? '—')],
        ['Routes', String(stats?.totalRoutes ?? '—')],
      ];
      (assignments as { student?: { user?: { firstName: string; lastName: string } }; vehicle?: { registration: string }; pickupPoint?: string }[])
        .slice(0, 30)
        .forEach((a) => {
          rows.push([
            `${a.student?.user?.firstName || ''} ${a.student?.user?.lastName || ''}`.trim(),
            a.vehicle?.registration || '—',
            a.pickupPoint || '—',
          ]);
        });
      return { title: 'Transport Report', headers: ['Student / Metric', 'Vehicle', 'Pickup'], rows };
    }
    case 'health': {
      const [visits, medicine] = await Promise.all([
        modulesApi.health.getVisits(),
        modulesApi.health.getMedicine(),
      ]);
      const rows: string[][] = [
        ['Clinic visits (sample)', String((visits as unknown[])?.length ?? 0)],
        ['Medicine items', String((medicine as unknown[])?.length ?? 0)],
      ];
      (visits as { student?: { user?: { firstName: string; lastName: string } }; reason?: string; visitDate?: string }[])
        .slice(0, 25)
        .forEach((v) => {
          rows.push([
            `${v.student?.user?.firstName || ''} ${v.student?.user?.lastName || ''}`.trim(),
            v.reason || '—',
            v.visitDate ? new Date(v.visitDate).toLocaleDateString() : '—',
          ]);
        });
      return { title: 'Health Report', headers: ['Student / Metric', 'Reason', 'Date'], rows };
    }
    case 'inventory': {
      const [assets, suppliers] = await Promise.all([
        modulesApi.inventory.getAssets(),
        modulesApi.inventory.getSuppliers(),
      ]);
      const rows: string[][] = [
        ['Total assets', String((assets as unknown[])?.length ?? 0), '—', '—', 'Summary'],
        ['Suppliers', String((suppliers as unknown[])?.length ?? 0), '—', '—', 'Summary'],
      ];
      (assets as { name: string; category: string; serialNumber?: string; location?: string; status: string }[])
        .forEach((a) => {
          rows.push([a.name, a.category, a.serialNumber || '—', a.location || '—', a.status]);
        });
      return { title: 'Inventory Report', headers: ['Name / Metric', 'Category', 'Serial', 'Location', 'Status'], rows };
    }
    default:
      return { title: 'Report', headers: ['Info'], rows: [['No data']] };
  }
}
