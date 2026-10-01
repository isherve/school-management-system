import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Megaphone, MessageSquare, Pin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { communicationApi } from '@/services/endpoints';
import { useTranslation, useFormatDate } from '@/i18n';

type Tab = 'announcements' | 'messages' | 'notifications';

export function CommunicationPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const [tab, setTab] = useState<Tab>('announcements');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: communicationApi.getAnnouncements,
    enabled: tab === 'announcements',
  });

  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: () => communicationApi.getMessages('inbox'),
    enabled: tab === 'messages',
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => communicationApi.getNotifications(true),
    enabled: tab === 'notifications',
  });

  const createMutation = useMutation({
    mutationFn: () => communicationApi.createAnnouncement({ title, content, isPinned: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowForm(false);
      setTitle('');
      setContent('');
    },
  });

  const tabs = [
    { id: 'announcements' as Tab, label: t('communication.announcements'), icon: Megaphone },
    { id: 'messages' as Tab, label: t('communication.messages'), icon: MessageSquare },
    { id: 'notifications' as Tab, label: t('communication.notifications'), icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('communication.title')}</h1>
          <p className="text-muted-foreground">{t('communication.subtitle')}</p>
        </div>
        {tab === 'announcements' && (
          <Button onClick={() => setShowForm(true)}><Megaphone className="h-4 w-4" /> {t('communication.newAnnouncement')}</Button>
        )}
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === tabItem.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            <tabItem.icon className="h-4 w-4" /> {tabItem.label}
          </button>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{t('communication.createAnnouncement')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-w-lg">
            <Input label={t('common.title')} value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('dashboard.content')}</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                <Send className="h-4 w-4" /> {t('communication.publish')}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'announcements' && (
        <div className="space-y-3">
          {announcements?.map((a: {
            id: string; title: string; content: string; isPinned: boolean;
            createdAt: string; author: { firstName: string; lastName: string };
          }) => (
            <Card key={a.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {a.isPinned && <Pin className="h-4 w-4 text-primary" />}
                      {a.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0 ml-4">
                    <p>{a.author.firstName} {a.author.lastName}</p>
                    <p>{formatDate(a.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) || <p className="text-muted-foreground text-center py-8">{t('communication.noAnnouncements')}</p>}
        </div>
      )}

      {tab === 'messages' && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {messages?.map((m: {
              id: string; subject?: string; content: string; createdAt: string;
              sender: { firstName: string; lastName: string };
            }) => (
              <div key={m.id} className="p-3 rounded-lg border border-border">
                <p className="font-medium">{m.subject || t('communication.noSubject')}</p>
                <p className="text-sm text-muted-foreground">{m.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('communication.from')}: {m.sender.firstName} {m.sender.lastName} · {formatDate(m.createdAt)}</p>
              </div>
            )) || <p className="text-muted-foreground text-center py-8">{t('communication.noMessages')}</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {notifications?.map((n: { id: string; title: string; message: string; createdAt: string; type: string }) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Bell className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            )) || <p className="text-muted-foreground text-center py-8">{t('communication.noNotifications')}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
