import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
  code: string;
  rememberMe?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  schoolId?: string;
  school?: { id: string; name: string; code: string; logo?: string };
}

export const authApi = {
  preparePasswordLogin: (email: string, password: string) =>
    api.post('/auth/login/prepare', { email, password }).then((r) => r.data as {
      success: boolean;
      message: string;
      devCode?: string;
      emailFailed?: boolean;
    }),

  login: (credentials: LoginCredentials) =>
    api.post('/auth/login', credentials).then((r) => r.data),

  requestLoginCode: (email: string) =>
    api.post('/auth/request-login-code', { email }).then((r) => r.data as {
      success: boolean;
      message: string;
      devCode?: string;
      emailFailed?: boolean;
      hint?: 'no_account';
    }),

  verifyLoginCode: (email: string, code: string) =>
    api.post('/auth/verify-login-code', { email, code }).then((r) => r.data),

  register: (data: Record<string, string>) =>
    api.post('/auth/register', data).then((r) => r.data),

  getProfile: () => api.get('/auth/me').then((r) => r.data.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  requestAccount: (data: Record<string, string>) =>
    api.post('/auth/request-account', data).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }).then((r) => r.data),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats').then((r) => r.data.data),
  getCharts: () => api.get('/dashboard/charts').then((r) => r.data.data),
  getEvents: () => api.get('/dashboard/events').then((r) => r.data.data),
  createEvent: (data: Record<string, unknown>) =>
    api.post('/dashboard/events', data).then((r) => r.data.data),
  updateEvent: (id: string, data: Record<string, unknown>) =>
    api.put(`/dashboard/events/${id}`, data).then((r) => r.data.data),
  deleteEvent: (id: string) => api.delete(`/dashboard/events/${id}`).then((r) => r.data),
};

export const studentApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/students', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/students/${id}`).then((r) => r.data.data),
  create: (data: Record<string, unknown>) =>
    api.post('/students', data).then((r) => r.data.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/students/${id}`, data).then((r) => r.data.data),
  getStats: () => api.get('/students/stats').then((r) => r.data.data),
};

export const teacherApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/teachers', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/teachers/${id}`).then((r) => r.data.data),
  create: (data: Record<string, unknown>) =>
    api.post('/teachers', data).then((r) => r.data.data),
  getStats: () => api.get('/teachers/stats').then((r) => r.data.data),
};

export const examApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/exams', { params }).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/exams', data).then((r) => r.data.data),
  enterMarks: (id: string, marks: unknown[]) =>
    api.post(`/exams/${id}/marks`, { marks }).then((r) => r.data.data),
  publish: (id: string) => api.post(`/exams/${id}/publish`).then((r) => r.data.data),
  getMeritList: (id: string) => api.get(`/exams/${id}/merit-list`).then((r) => r.data.data),
  getAnalysis: (id: string) => api.get(`/exams/${id}/analysis`).then((r) => r.data.data),
};

export const financeApi = {
  getSummary: () => api.get('/finance/summary').then((r) => r.data.data),
  getInvoices: (params?: Record<string, string>) =>
    api.get('/finance/invoices', { params }).then((r) => r.data),
  getFeeStructures: () => api.get('/finance/fee-structures').then((r) => r.data.data),
  createInvoice: (data: Record<string, unknown>) =>
    api.post('/finance/invoices', data).then((r) => r.data.data),
  recordPayment: (invoiceId: string, data: Record<string, unknown>) =>
    api.post(`/finance/invoices/${invoiceId}/payments`, data).then((r) => r.data.data),
};

export const parentApi = {
  getChildren: () => api.get('/parent/children').then((r) => r.data.data),
  getAttendance: (studentId: string) =>
    api.get(`/parent/children/${studentId}/attendance`).then((r) => r.data.data),
  getResults: (studentId: string) =>
    api.get(`/parent/children/${studentId}/results`).then((r) => r.data.data),
  getFees: (studentId: string) =>
    api.get(`/parent/children/${studentId}/fees`).then((r) => r.data.data),
  getTimetable: (studentId: string) =>
    api.get(`/parent/children/${studentId}/timetable`).then((r) => r.data.data),
  getAssignments: (studentId: string) =>
    api.get(`/parent/children/${studentId}/assignments`).then((r) => r.data.data),
  getLibrary: (studentId: string) =>
    api.get(`/parent/children/${studentId}/library`).then((r) => r.data.data),
  getTransport: (studentId: string) =>
    api.get(`/parent/children/${studentId}/transport`).then((r) => r.data.data),
};

export const studentPortalApi = {
  getProfile: () => api.get('/student/profile').then((r) => r.data.data),
  getResults: () => api.get('/student/results').then((r) => r.data.data),
  getAttendance: () => api.get('/student/attendance').then((r) => r.data.data),
  getFees: () => api.get('/student/fees').then((r) => r.data.data),
  getTimetable: () => api.get('/student/timetable').then((r) => r.data.data),
  getAssignments: () => api.get('/student/assignments').then((r) => r.data.data),
  submitAssignment: (assignmentId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/student/assignments/${assignmentId}/submit`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },
  getLibrary: () => api.get('/student/library').then((r) => r.data.data),
  getTransport: () => api.get('/student/transport').then((r) => r.data.data),
  getHostel: () => api.get('/student/hostel').then((r) => r.data.data),
};

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | string;
  content: string;
  provider?: string | null;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title: string;
  language: string;
  updatedAt: string;
  messages: AiMessage[];
}

export const aiApi = {
  status: () => api.get('/ai/status').then((r) => r.data.data as {
    mode: 'openai' | 'gemini' | 'fallback';
    model: string | null;
    liveModelConfigured: boolean;
    languages: string[];
  }),
  listConversations: () => api.get('/ai/conversations').then((r) => r.data.data as Array<{
    id: string;
    title: string;
    language: string;
    updatedAt: string;
    messages: { content: string; role: string }[];
  }>),
  createConversation: (language: string) =>
    api.post('/ai/conversations', { language }).then((r) => r.data.data as AiConversation),
  getConversation: (id: string) =>
    api.get(`/ai/conversations/${id}`).then((r) => r.data.data as AiConversation),
  deleteConversation: (id: string) => api.delete(`/ai/conversations/${id}`).then((r) => r.data),
  sendMessage: (id: string, content: string, language: string) =>
    api.post(`/ai/conversations/${id}/messages`, { content, language }).then((r) => r.data.data as AiConversation),
  generateReportComment: (data: Record<string, unknown>) =>
    api.post('/ai/report-comment', data).then((r) => r.data.data),
  generateLessonPlan: (data: Record<string, unknown>) =>
    api.post('/ai/lesson-plan', data).then((r) => r.data.data),
  analyzeStudentRisk: (data: Record<string, unknown>) =>
    api.post('/ai/student-risk', data).then((r) => r.data.data),
};

export const searchApi = {
  global: (q: string) => api.get('/search', { params: { q } }).then((r) => r.data.data),
};

export const attendanceApi = {
  getStats: (date?: string) => api.get('/attendance/stats', { params: { date } }).then((r) => r.data.data),
  getReport: (params?: Record<string, string>) => api.get('/attendance/report', { params }).then((r) => r.data.data),
  getClassAttendance: (classId: string, date: string) =>
    api.get(`/attendance/class/${classId}`, { params: { date } }).then((r) => r.data.data),
  markClassAttendance: (classId: string, data: Record<string, unknown>) =>
    api.post(`/attendance/class/${classId}`, data).then((r) => r.data),
  getStudentHistory: (studentId: string) =>
    api.get(`/attendance/student/${studentId}`).then((r) => r.data.data),
};

export const academicsApi = {
  getOverview: () => api.get('/academics/overview').then((r) => r.data.data),
  getDepartments: () => api.get('/academics/departments').then((r) => r.data.data),
  createDepartment: (data: Record<string, unknown>) =>
    api.post('/academics/departments', data).then((r) => r.data.data),
  getClasses: () => api.get('/academics/classes').then((r) => r.data.data),
  createClass: (data: Record<string, unknown>) =>
    api.post('/academics/classes', data).then((r) => r.data.data),
  getSubjects: () => api.get('/academics/subjects').then((r) => r.data.data),
  createSubject: (data: Record<string, unknown>) =>
    api.post('/academics/subjects', data).then((r) => r.data.data),
  assignSubject: (classId: string, data: Record<string, unknown>) =>
    api.post(`/academics/classes/${classId}/subjects`, data).then((r) => r.data.data),
};

export const settingsApi = {
  getSchool: () => api.get('/settings/school').then((r) => r.data.data),
  updateSchool: (data: Record<string, unknown>) =>
    api.put('/settings/school', data).then((r) => r.data.data),
  getAcademicYears: () => api.get('/settings/academic-years').then((r) => r.data.data),
  createAcademicYear: (data: Record<string, unknown>) =>
    api.post('/settings/academic-years', data).then((r) => r.data.data),
  createTerm: (yearId: string, data: Record<string, unknown>) =>
    api.post(`/settings/academic-years/${yearId}/terms`, data).then((r) => r.data.data),
  getGrading: () => api.get('/settings/grading').then((r) => r.data.data),
  createGrade: (data: Record<string, unknown>) =>
    api.post('/settings/grading', data).then((r) => r.data.data),
  getIntegrations: () => api.get('/settings/integrations').then((r) => r.data.data),
};

export const communicationApi = {
  getAnnouncements: () => api.get('/communication/announcements').then((r) => r.data.data),
  createAnnouncement: (data: Record<string, unknown>) =>
    api.post('/communication/announcements', data).then((r) => r.data.data),
  updateAnnouncement: (id: string, data: Record<string, unknown>) =>
    api.put(`/communication/announcements/${id}`, data).then((r) => r.data.data),
  deleteAnnouncement: (id: string) =>
    api.delete(`/communication/announcements/${id}`).then((r) => r.data),
  getMessages: (type?: string) =>
    api.get('/communication/messages', { params: { type } }).then((r) => r.data.data),
  sendMessage: (data: Record<string, unknown>) =>
    api.post('/communication/messages', data).then((r) => r.data.data),
  getNotifications: (unread?: boolean) =>
    api.get('/communication/notifications', { params: { unread } }).then((r) => r.data.data),
};

export const userApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/users', { params }).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/users', data).then((r) => r.data.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/users/${id}`, data).then((r) => r.data.data),
  resetPassword: (id: string, password: string) =>
    api.post(`/users/${id}/reset-password`, { password }).then((r) => r.data),
  getAccountRequests: (status?: string) =>
    api.get('/users/account-requests', { params: status ? { status } : undefined }).then((r) => r.data.data),
  approveAccountRequest: (id: string, data?: {
    classId?: string;
    password?: string;
    studentIds?: string[];
    guardianRelationship?: string;
  }) =>
    api.post(`/users/account-requests/${id}/approve`, data || {}).then((r) => r.data),
  rejectAccountRequest: (id: string, reason?: string) =>
    api.post(`/users/account-requests/${id}/reject`, { reason }).then((r) => r.data),
};

export const libraryApi = {
  getStats: () => api.get('/library/stats').then((r) => r.data.data),
  getBooks: (params?: Record<string, string>) =>
    api.get('/library/books', { params }).then((r) => r.data),
  createBook: (data: Record<string, unknown>) =>
    api.post('/library/books', data).then((r) => r.data.data),
  updateBook: (id: string, data: Record<string, unknown>) =>
    api.put(`/library/books/${id}`, data).then((r) => r.data.data),
  getBorrowings: (activeOnly = true) =>
    api.get('/library/borrowings', { params: { activeOnly: String(activeOnly) } }).then((r) => r.data.data),
  borrow: (data: Record<string, unknown>) =>
    api.post('/library/borrow', data).then((r) => r.data.data),
  returnBook: (id: string) => api.post(`/library/return/${id}`).then((r) => r.data.data),
};

export const modulesApi = {
  transport: {
    getVehicles: () => api.get('/modules/transport/vehicles').then((r) => r.data.data),
    getStats: () => api.get('/modules/transport/stats').then((r) => r.data.data),
    getAssignments: () => api.get('/modules/transport/assignments').then((r) => r.data.data),
    createVehicle: (data: Record<string, unknown>) =>
      api.post('/modules/transport/vehicles', data).then((r) => r.data.data),
  },
  hostel: {
    getRooms: () => api.get('/modules/hostel/rooms').then((r) => r.data.data),
    getStats: () => api.get('/modules/hostel/stats').then((r) => r.data.data),
    createRoom: (data: Record<string, unknown>) =>
      api.post('/modules/hostel/rooms', data).then((r) => r.data.data),
  },
  health: {
    getVisits: () => api.get('/modules/health/visits').then((r) => r.data.data),
    getMedicine: () => api.get('/modules/health/medicine').then((r) => r.data.data),
  },
  hr: {
    getEmployees: (params?: Record<string, string>) =>
      api.get('/modules/hr/employees', { params }).then((r) => r.data),
    getLeave: () => api.get('/modules/hr/leave').then((r) => r.data.data),
    getStats: () => api.get('/modules/hr/stats').then((r) => r.data.data),
  },
  inventory: {
    getAssets: () => api.get('/modules/inventory/assets').then((r) => r.data.data),
    getSuppliers: () => api.get('/modules/inventory/suppliers').then((r) => r.data.data),
    createAsset: (data: Record<string, unknown>) =>
      api.post('/modules/inventory/assets', data).then((r) => r.data.data),
  },
  timetable: {
    getClass: (classId: string) =>
      api.get(`/modules/timetable/class/${classId}`).then((r) => r.data.data),
  },
  learning: {
    getAssignments: () => api.get('/modules/learning/assignments').then((r) => r.data.data),
    getAssignment: (id: string) => api.get(`/modules/learning/assignments/${id}`).then((r) => r.data.data),
    getSubmissions: (id: string) => api.get(`/modules/learning/assignments/${id}/submissions`).then((r) => r.data.data),
    createAssignment: (data: Record<string, unknown>, file?: File) => {
      const form = new FormData();
      Object.entries(data).forEach(([k, v]) => form.append(k, String(v)));
      if (file) form.append('file', file);
      return api.post('/modules/learning/assignments', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data.data);
    },
    gradeSubmission: (id: string, data: { marks?: number; feedback?: string }) =>
      api.patch(`/modules/learning/submissions/${id}/grade`, data).then((r) => r.data.data),
  },
};
