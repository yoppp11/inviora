import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

interface ValidateOptions {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidateOptions) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw new ValidationError('Validation failed', formatted);
      }
      throw error;
    }
  };
}
