import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config } from '../../config/index.js';
import { uploadToCloudinary } from './cloudinary.service.js';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

export async function storeAssignmentPdf(
  file: Express.Multer.File,
  subfolder: 'materials' | 'submissions' = 'materials'
): Promise<{ fileUrl: string; fileName: string }> {
  const fileName = file.originalname || 'document.pdf';

  if (config.cloudinary.cloudName && config.cloudinary.apiKey) {
    const { url } = await uploadToCloudinary(file, `assignments/${subfolder}`);
    return { fileUrl: url, fileName };
  }

  const dir = path.join(UPLOAD_ROOT, 'assignments', subfolder);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(fileName) || '.pdf';
  const stored = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, stored), file.buffer);
  const fileUrl = `/api/${config.apiVersion}/files/assignments/${subfolder}/${stored}`;
  return { fileUrl, fileName };
}

export function parseAttachments(raw: unknown): { fileName: string; fileUrl: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  if (typeof a.fileUrl === 'string') {
    return { fileUrl: a.fileUrl, fileName: String(a.fileName || 'assignment.pdf') };
  }
  return null;
}
