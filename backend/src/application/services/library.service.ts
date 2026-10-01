import { BookStatus, Prisma } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError, ValidationError } from '../../shared/errors/app.error.js';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/index.js';

export class LibraryService {
  async findBooks(schoolId: string, query: Record<string, unknown>) {
    const { page, limit, sortBy, sortOrder, search } = getPaginationParams(query);
    const category = query.category as string | undefined;

    const where: Prisma.LibraryBookWhereInput = {
      schoolId,
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { author: { contains: search } },
          { isbn: { contains: search } },
        ],
      }),
    };

    const [books, total] = await Promise.all([
      prisma.libraryBook.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.libraryBook.count({ where }),
    ]);

    return buildPaginatedResult(books, total, page, limit);
  }

  async createBook(
    schoolId: string,
    data: {
      title: string;
      author?: string;
      isbn?: string;
      category?: string;
      publisher?: string;
      quantity?: number;
      location?: string;
      description?: string;
    }
  ) {
    const qty = data.quantity || 1;
    return prisma.libraryBook.create({
      data: {
        schoolId,
        ...data,
        quantity: qty,
        available: qty,
        status: 'AVAILABLE',
      },
    });
  }

  async updateBook(
    id: string,
    schoolId: string,
    data: Partial<{
      title: string;
      author: string;
      isbn: string;
      category: string;
      publisher: string;
      quantity: number;
      location: string;
      description: string;
    }>
  ) {
    const book = await prisma.libraryBook.findFirst({ where: { id, schoolId } });
    if (!book) throw new NotFoundError('Book');

    const borrowed = book.quantity - book.available;
    const newQty = data.quantity ?? book.quantity;
    if (newQty < borrowed) {
      throw new ValidationError(`Cannot reduce quantity below ${borrowed} (currently borrowed)`);
    }

    return prisma.libraryBook.update({
      where: { id },
      data: {
        ...data,
        ...(data.quantity !== undefined && { available: newQty - borrowed }),
      },
    });
  }

  async borrowBook(bookId: string, studentId: string, dueDate: string, notes?: string) {
    const book = await prisma.libraryBook.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError('Book');
    if (book.available <= 0) throw new ValidationError('Book not available');

    return prisma.$transaction(async (tx) => {
      await tx.libraryBook.update({
        where: { id: bookId },
        data: { available: { decrement: 1 }, status: book.available - 1 <= 0 ? 'BORROWED' : book.status },
      });

      return tx.bookBorrowing.create({
        data: {
          bookId,
          studentId,
          dueDate: new Date(dueDate),
          status: 'BORROWED',
          notes,
        },
        include: {
          book: true,
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      });
    });
  }

  async returnBook(borrowingId: string) {
    const borrowing = await prisma.bookBorrowing.findUnique({
      where: { id: borrowingId },
      include: { book: true },
    });
    if (!borrowing) throw new NotFoundError('Borrowing record');
    if (borrowing.returnedAt) throw new ValidationError('Book already returned');

    const daysLate = Math.max(
      0,
      Math.floor((Date.now() - borrowing.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const fine = daysLate * 50;

    return prisma.$transaction(async (tx) => {
      await tx.libraryBook.update({
        where: { id: borrowing.bookId },
        data: {
          available: { increment: 1 },
          status: 'AVAILABLE' as BookStatus,
        },
      });

      return tx.bookBorrowing.update({
        where: { id: borrowingId },
        data: {
          returnedAt: new Date(),
          fine,
          status: 'AVAILABLE' as BookStatus,
        },
      });
    });
  }

  async getBorrowings(schoolId: string, activeOnly = true) {
    return prisma.bookBorrowing.findMany({
      where: {
        student: { schoolId },
        ...(activeOnly ? { returnedAt: null } : {}),
      },
      include: {
        book: true,
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            class: { select: { name: true, section: true } },
          },
        },
      },
      orderBy: { borrowedAt: 'desc' },
    });
  }

  async getStats(schoolId: string) {
    const [totalBooks, available, borrowed, overdue] = await Promise.all([
      prisma.libraryBook.aggregate({ where: { schoolId }, _sum: { quantity: true } }),
      prisma.libraryBook.aggregate({ where: { schoolId }, _sum: { available: true } }),
      prisma.bookBorrowing.count({
        where: { student: { schoolId }, returnedAt: null },
      }),
      prisma.bookBorrowing.count({
        where: {
          student: { schoolId },
          returnedAt: null,
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      totalBooks: totalBooks._sum.quantity || 0,
      available: available._sum.available || 0,
      borrowed,
      overdue,
    };
  }
}

export const libraryService = new LibraryService();
