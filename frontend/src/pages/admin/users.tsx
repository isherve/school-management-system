import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Info, KeyRound, Pencil, Check, X, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { userApi, academicsApi, studentApi } from '@/services/endpoints';
import { useTranslation, useFormatDate } from '@/i18n';

const ROLES = [
  'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL', 'REGISTRAR', 'BURSAR',
  'ACCOUNTANT', 'TEACHER', 'CLASS_TEACHER', 'LIBRARIAN', 'PARENT', 'STUDENT',
];

const GUARDIAN_RELATIONSHIPS = ['Parent', 'Father', 'Mother', 'Guardian'] as const;

function StudentLinkPicker({
  students,
  selectedIds,
  onChange,
  label,
  hint,
}: {
  students: { id: string; admissionNumber: string; user: { firstName: string; lastName: string } }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label: string;
  hint: string;
}) {
  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">{label}</label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="max-h-40 overflow-y-auto rounded-md border border-input p-2 space-y-1">
        {students.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">—</p>
        ) : (
          students.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
              <input
                type="checkbox"
                checked={selectedIds.includes(s.id)}
                onChange={() => toggle(s.id)}
                className="rounded border-input"
              />
              <span>
                {s.user.firstName} {s.user.lastName}
                <span className="text-muted-foreground ml-1 font-mono text-xs">({s.admissionNumber})</span>
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

type AdminTab = 'users' | 'requests';

export function AdminUsersPage() {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const roleLabel = (role: string) => {
    const key = `roles.${role}`;
    const label = t(key);
    return label !== key ? label : role.replace(/_/g, ' ');
  };
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>('users');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [approveRequest, setApproveRequest] = useState<{
    id: string; name: string; email: string; position: string; employmentGroup: string; regNo: string;
    parentEmail?: string | null;
  } | null>(null);
  const [approveClassId, setApproveClassId] = useState('');
  const [approveLinkedStudentIds, setApproveLinkedStudentIds] = useState<string[]>([]);
  const [guardianRelationship, setGuardianRelationship] = useState('Parent');
  const [linkedStudentIds, setLinkedStudentIds] = useState<string[]>([]);
  const [rejectRequest, setRejectRequest] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editUser, setEditUser] = useState<{
    id: string; firstName: string; lastName: string; phone?: string; role: string; status: string;
  } | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('Admin@123');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: 'Admin@123',
    role: 'TEACHER', phone: '', classId: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => userApi.getAll({ page: String(page), limit: '15', search }),
  });

  const { data: classes } = useQuery({
    queryKey: ['academics-classes'],
    queryFn: academicsApi.getClasses,
    enabled: (showAdd && form.role === 'STUDENT') || (!!approveRequest && approveRequest.position === 'Student'),
  });

  const needStudentPicker =
    (showAdd && form.role === 'PARENT') || (!!approveRequest && approveRequest.position === 'Parent');

  const { data: studentsForLink } = useQuery({
    queryKey: ['students-link-picker'],
    queryFn: () => studentApi.getAll({ limit: '500' }),
    enabled: needStudentPicker,
  });

  const linkableStudents = (studentsForLink?.data || []) as {
    id: string;
    admissionNumber: string;
    user: { firstName: string; lastName: string };
  }[];

  const { data: accountRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['account-requests'],
    queryFn: () => userApi.getAccountRequests(),
  });

  const pendingCount = accountRequests?.filter((r: { status: string }) => r.status === 'PENDING').length || 0;

  const createMutation = useMutation({
    mutationFn: () => userApi.create({
      ...form,
      ...(form.role === 'PARENT'
        ? { studentIds: linkedStudentIds, guardianRelationship }
        : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', email: '', password: 'Admin@123', role: 'TEACHER', phone: '', classId: '' });
      setLinkedStudentIds([]);
      setGuardianRelationship('Parent');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => userApi.update(editUser!.id, {
      firstName: editUser!.firstName,
      lastName: editUser!.lastName,
      phone: editUser!.phone,
      role: editUser!.role,
      status: editUser!.status,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditUser(null);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => userApi.resetPassword(resetId!, newPassword),
    onSuccess: () => {
      setResetId(null);
      setNewPassword('Admin@123');
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => userApi.approveAccountRequest(approveRequest!.id, {
      classId: approveClassId || undefined,
      password: 'Admin@123',
      ...(approveRequest!.position === 'Parent'
        ? { studentIds: approveLinkedStudentIds, guardianRelationship }
        : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setApproveRequest(null);
      setApproveClassId('');
      setApproveLinkedStudentIds([]);
      setGuardianRelationship('Parent');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => userApi.rejectAccountRequest(rejectRequest!.id, rejectReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-requests'] });
      setRejectRequest(null);
      setRejectReason('');
    },
  });

  const users = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
          <p className="text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <UserPlus className="h-4 w-4" /> {t('admin.addUser')}
        </Button>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          {t('admin.allUsers')}
        </button>
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Inbox className="h-4 w-4" />
          {t('admin.accountRequests')}
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">{pendingCount}</span>
          )}
        </button>
      </div>

      {tab === 'users' && (
        <>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-5 w-5 text-primary" /> {t('admin.howToTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>{t('admin.step1')}</li>
            <li>{t('admin.step2')}</li>
            <li>{t('admin.step3')}</li>
            <li>{t('admin.step4')}</li>
            <li>{t('admin.step5')}</li>
            <li>{t('admin.step6')}</li>
          </ol>
          <p className="pt-1">{t('admin.defaultPassword')}: <code className="text-foreground bg-muted px-1 rounded">Admin@123</code></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle>{t('adminTable.allUsersCount', { count: meta?.total || 0 })}</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('adminTable.searchPlaceholder')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">{t('adminTable.name')}</th>
                    <th className="text-left py-3 px-2 font-medium">{t('adminTable.email')}</th>
                    <th className="text-left py-3 px-2 font-medium">{t('adminTable.role')}</th>
                    <th className="text-left py-3 px-2 font-medium">{t('adminTable.status')}</th>
                    <th className="text-right py-3 px-2 font-medium">{t('adminTable.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: {
                    id: string; firstName: string; lastName: string; email: string;
                    role: string; status: string; phone?: string;
                  }) => (
                    <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{u.firstName} {u.lastName}</td>
                      <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-2">{roleLabel(u.role)}</td>
                      <td className="py-3 px-2"><StatusBadge status={u.status} /></td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditUser({ ...u })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setResetId(u.id)}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-8">{t('admin.noUsers')}</p>
              )}
              {meta && meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.previous')}</Button>
                  <span className="py-2 text-sm text-muted-foreground">{t('common.page')} {page} {t('common.of')} {meta.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>{t('common.next')}</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {tab === 'requests' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.accountRequestsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium">{t('adminTable.name')}</th>
                      <th className="text-left py-3 px-2 font-medium">{t('adminTable.email')}</th>
                      <th className="text-left py-3 px-2 font-medium">{t('adminTable.position')}</th>
                      <th className="text-left py-3 px-2 font-medium">{t('adminTable.boarding')}</th>
                      <th className="text-left py-3 px-2 font-medium">{t('adminTable.campus')}</th>
                      <th className="text-left py-3 px-2 font-medium">{t('adminTable.status')}</th>
                      <th className="text-left py-3 px-2 font-medium">{t('adminTable.submitted')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('adminTable.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountRequests?.map((r: {
                      id: string; name: string; email: string; phone: string; position: string;
                      employmentGroup: string; campus: string; college: string; regNo: string;
                      gender: string; degree: string; qualification: string; status: string; createdAt: string;
                    }) => (
                      <tr key={r.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{r.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{r.email}</td>
                        <td className="py-3 px-2">{r.position}</td>
                        <td className="py-3 px-2">{r.employmentGroup}</td>
                        <td className="py-3 px-2 text-muted-foreground">{r.campus}</td>
                        <td className="py-3 px-2"><StatusBadge status={r.status} /></td>
                        <td className="py-3 px-2 text-muted-foreground">{formatDate(r.createdAt)}</td>
                        <td className="py-3 px-2 text-right">
                          {r.status === 'PENDING' ? (
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setApproveRequest({
                                  id: r.id, name: r.name, email: r.email, position: r.position,
                                  employmentGroup: r.employmentGroup, regNo: r.regNo,
                                  parentEmail: (r as { parentEmail?: string }).parentEmail,
                                });
                                setApproveLinkedStudentIds([]);
                                setGuardianRelationship('Parent');
                              }}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setRejectRequest({ id: r.id, name: r.name })}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!accountRequests || accountRequests.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">{t('admin.noAccountRequests')}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal open={!!approveRequest} onClose={() => setApproveRequest(null)} title={t('admin.approveRequest')}>
        {approveRequest && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('admin.approveRequestHint', { name: approveRequest.name, email: approveRequest.email })}
            </p>
            <div className="rounded-lg border border-border p-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">Position:</span> {approveRequest.position}</p>
              <p><span className="text-muted-foreground">Boarding:</span> {approveRequest.employmentGroup}</p>
            </div>
            {approveRequest.position === 'Student' && approveRequest.parentEmail && (
              <p className="text-sm text-muted-foreground">
                {t('auth.requestAccountParentEmail')}: <strong>{approveRequest.parentEmail}</strong>
              </p>
            )}
            {approveRequest.position === 'Student' && classes?.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.selectClass')}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={approveClassId}
                  onChange={(e) => setApproveClassId(e.target.value)}
                >
                  <option value="">— {t('admin.selectClass')} —</option>
                  {classes.map((c: { id: string; name: string; section?: string }) => (
                    <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            {approveRequest.position === 'Parent' && (
              <>
                <p className="text-xs text-muted-foreground">
                  {t('admin.approveParentLinkHint', { regNo: approveRequest.regNo })}
                </p>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('admin.guardianRelationship')}</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                  >
                    {GUARDIAN_RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <StudentLinkPicker
                  students={linkableStudents}
                  selectedIds={approveLinkedStudentIds}
                  onChange={setApproveLinkedStudentIds}
                  label={t('admin.linkChildren')}
                  hint={t('admin.linkChildrenHint')}
                />
              </>
            )}
            <p className="text-xs text-muted-foreground">{t('admin.defaultPassword')}: Admin@123</p>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? t('admin.approving') : t('admin.approveAndCreate')}
              </Button>
              <Button variant="outline" onClick={() => setApproveRequest(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectRequest} onClose={() => setRejectRequest(null)} title={t('admin.rejectRequest')}>
        {rejectRequest && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('admin.rejectRequestHint', { name: rejectRequest.name })}
            </p>
            <Input
              label={t('admin.rejectReason')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2 pt-2">
              <Button variant="destructive" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
                {rejectMutation.isPending ? t('admin.rejecting') : t('admin.rejectRequest')}
              </Button>
              <Button variant="outline" onClick={() => setRejectRequest(null)}>{t('adminTable.cancel')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('adminTable.addNewUser')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('admin.firstName')} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label={t('admin.lastName')} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label={t('common.email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label={t('common.password')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input label={t('common.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div>
            <label className="text-sm font-medium mb-1 block">{t('common.role')}</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
          </div>
          {form.role === 'STUDENT' && classes?.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.selectClass')}</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
              >
                <option value="">— {t('admin.selectClass')} —</option>
                {classes.map((c: { id: string; name: string; section?: string }) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ''}</option>
                ))}
              </select>
            </div>
          )}
          {form.role === 'PARENT' && (
            <>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.guardianRelationship')}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={guardianRelationship}
                  onChange={(e) => setGuardianRelationship(e.target.value)}
                >
                  {GUARDIAN_RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <StudentLinkPicker
                students={linkableStudents}
                selectedIds={linkedStudentIds}
                onChange={setLinkedStudentIds}
                label={t('admin.linkChildren')}
                hint={t('admin.linkChildrenHint')}
              />
            </>
          )}
          <div className="flex gap-2 pt-2">
            <Button onClick={() => createMutation.mutate()} disabled={!form.email || !form.firstName || createMutation.isPending}>
              {createMutation.isPending ? t('admin.creating') : t('admin.createUser')}
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>{t('adminTable.cancel')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={t('admin.editUser')}>
        {editUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('admin.firstName')} value={editUser.firstName} onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })} />
              <Input label={t('admin.lastName')} value={editUser.lastName} onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })} />
            </div>
            <Input label={t('common.phone')} value={editUser.phone || ''} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} />
            <div>
              <label className="text-sm font-medium mb-1 block">{t('common.role')}</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editUser.role}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
              >
                {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('common.status')}</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editUser.status}
                onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
              >
                <option value="ACTIVE">{t('status.ACTIVE')}</option>
                <option value="INACTIVE">{t('status.INACTIVE')}</option>
                <option value="SUSPENDED">{t('status.SUSPENDED')}</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('common.saving') : t('admin.saveChanges')}
              </Button>
              <Button variant="outline" onClick={() => setEditUser(null)}>{t('adminTable.cancel')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!resetId} onClose={() => setResetId(null)} title={t('admin.resetPassword')}>
        <div className="space-y-4">
          <Input label={t('admin.newPassword')} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <div className="flex gap-2 pt-2">
            <Button onClick={() => resetMutation.mutate()} disabled={newPassword.length < 8 || resetMutation.isPending}>
              {resetMutation.isPending ? t('admin.resetting') : t('admin.resetPassword')}
            </Button>
            <Button variant="outline" onClick={() => setResetId(null)}>{t('adminTable.cancel')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
