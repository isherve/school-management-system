import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { parseAttachment, resolveFileUrl } from '@/lib/file-url';
import { studentPortalApi } from '@/services/endpoints';

interface AssignmentActionsProps {
  assignmentId: string;
  attachments?: unknown;
  submission?: { fileUrl?: string | null; submittedAt?: string } | null;
  /** student uses student portal API; teacher view is read-only */
  mode: 'student' | 'teacher';
  invalidateKeys?: string[][];
}

export function AssignmentActions({
  assignmentId,
  attachments,
  submission,
  mode,
  invalidateKeys = [['student-assignments'], ['learning-assignments']],
}: AssignmentActionsProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const material = parseAttachment(attachments);

  const submitMutation = useMutation({
    mutationFn: (file: File) => studentPortalApi.submitAssignment(assignmentId, file),
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      setError('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || t('learning.submitFailed'));
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError(t('learning.pdfOnly'));
      return;
    }
    submitMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
      {material && (
        <a href={resolveFileUrl(material.fileUrl)} target="_blank" rel="noopener noreferrer" download={material.fileName}>
          <Button type="button" variant="outline" size="sm">
            <Download className="h-4 w-4" />
            {t('learning.downloadMaterial')}
          </Button>
        </a>
      )}

      {mode === 'student' && (
        <>
          <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
          <Button
            type="button"
            size="sm"
            variant={submission?.fileUrl ? 'outline' : 'default'}
            disabled={submitMutation.isPending}
            onClick={() => fileRef.current?.click()}
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {submission?.fileUrl ? t('learning.resubmitPdf') : t('learning.submitPdf')}
          </Button>
        </>
      )}

      {submission?.fileUrl && (
        <a href={resolveFileUrl(submission.fileUrl)} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="ghost" size="sm">
            <FileText className="h-4 w-4" />
            {mode === 'student' ? t('learning.viewMySubmission') : t('learning.viewSubmission')}
          </Button>
        </a>
      )}

      {error && <p className="text-xs text-destructive w-full">{error}</p>}
    </div>
  );
}

/** Teacher: download submission PDFs from list */
export function SubmissionDownloadLink({ fileUrl, label }: { fileUrl: string; label?: string }) {
  const { t } = useTranslation();
  return (
    <a href={resolveFileUrl(fileUrl)} target="_blank" rel="noopener noreferrer">
      <Button type="button" variant="outline" size="sm">
        <Download className="h-4 w-4" />
        {label || t('learning.viewSubmission')}
      </Button>
    </a>
  );
}
