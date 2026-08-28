import { Response, NextFunction } from 'express';
import { AuthRequest, ValidationRule } from '../types';

export function validate(rules: ValidationRule[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`${rule.field} must be a string`);
      } else if (rule.type === 'number' && typeof value !== 'number') {
        errors.push(`${rule.field} must be a number`);
      } else if (rule.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${rule.field} must be a boolean`);
      } else if (rule.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${rule.field} must be a valid email`);
        }
      }

      if (rule.min !== undefined && typeof value === 'string' && value.length < rule.min) {
        errors.push(`${rule.field} must be at least ${rule.min} characters`);
      }
      if (rule.max !== undefined && typeof value === 'string' && value.length > rule.max) {
        errors.push(`${rule.field} must be at most ${rule.max} characters`);
      }
      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors.push(`${rule.field} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        errors.push(`${rule.field} must be at most ${rule.max}`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    next();
  };
}
