import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { config } from '../../config/index.js';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors/app.error.js';
import { TokenPayload } from '../../application/services/auth.service.js';
import { hasRoleAccess, hasMinimumRole } from '../../shared/constants/roles.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!hasRoleAccess(req.user.role, roles)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

export function authorizeMinimum(minimumRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!hasMinimumRole(req.user.role, minimumRole)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

export function requireSchool(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.schoolId) {
    return next(new ForbiddenError('School context required'));
  }
  next();
}
