import { AppError } from '../errors/app.error.js';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function getPaginationParams(query: Record<string, unknown>): Required<PaginationParams> {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '10'), 10)));
  const sortBy = String(query.sortBy || 'createdAt');
  const sortOrder = (query.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
  const search = String(query.search || '');

  return { page, limit, sortBy, sortOrder, search };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function getRouteParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export function generateAdmissionNumber(schoolCode: string, sequence: number): string {
  const year = new Date().getFullYear();
  return `${schoolCode}/${year}/${String(sequence).padStart(4, '0')}`;
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `RCP-${timestamp}`;
}

export function calculateGrade(
  score: number,
  gradingSystem: { minScore: number; maxScore: number; grade: string }[]
): string {
  const match = gradingSystem.find((g) => score >= Number(g.minScore) && score <= Number(g.maxScore));
  return match?.grade || 'F';
}

export async function withTransaction<T>(
  fn: () => Promise<T>,
  errorMessage = 'Transaction failed'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(errorMessage, 500);
  }
}
