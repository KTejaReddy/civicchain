import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  walletAddress: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'optional';
  required?: boolean;
  min?: number;
  max?: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  skip?: number;
}
