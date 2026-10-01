import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, User, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { modulesApi, academicsApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

type TimetableSlot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  subject?: { name: string; code?: string } | null;
  teacher?: { name: string; specialization?: string } | null;
};

export function TimetablePage() {
  const { t } = useTranslation();
  const [selectedClass, setSelectedClass] = useState('');

  const days = useMemo(
    () => DAY_KEYS.map((key, index) => ({ index, label: t(`days.${key}`) })),
    [t]
  );

  const { data: classes } = useQuery({ queryKey: ['academics-classes'], queryFn: academicsApi.getClasses });
  const { data: timetable } = useQuery({
    queryKey: ['timetable', selectedClass],
    queryFn: () => modulesApi.timetable.getClass(selectedClass),
    enabled: !!selectedClass,
  });

  useEffect(() => {
    if (classes?.length && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  const slotsByDay = days.map(({ index, label }) => ({
    day: label,
    slots: (timetable as TimetableSlot[] | undefined)?.filter((s) => s.dayOfWeek === index) || [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('timetable.title')}</h1>
        <p className="text-muted-foreground">{t('timetable.subtitle')}</p>
      </div>
      <select
        value={selectedClass}
        onChange={(e) => setSelectedClass(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[200px]"
        aria-label={t('timetable.selectClass')}
      >
        <option value="">{t('timetable.selectClass')}</option>
        {classes?.map((c: { id: string; name: string; section?: string }) => (
          <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>
        ))}
      </select>
      {!selectedClass ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">{t('timetable.selectClass')}</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {slotsByDay.filter((d) => d.slots.length > 0).map(({ day, slots }) => (
            <Card key={day}>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> {day}</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-2 px-2 font-medium">{t('timetable.time')}</th>
                        <th className="py-2 px-2 font-medium">{t('timetable.subject')}</th>
                        <th className="py-2 px-2 font-medium">{t('timetable.teacher')}</th>
                        <th className="py-2 px-2 font-medium">{t('timetable.room')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map((slot) => (
                        <tr key={slot.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {slot.startTime} — {slot.endTime}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="flex items-center gap-1.5 font-medium">
                              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                              {slot.subject?.name || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {slot.teacher?.name || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">{slot.room || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
          {slotsByDay.every((d) => d.slots.length === 0) && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">{t('timetable.empty')}</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
