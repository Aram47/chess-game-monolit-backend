/**
 * Registration form validation schema
 * Validation rules match backend DTO exactly:
 * - CreateUserDto from common/dtos/user/user.create.dto.ts
 */

import { z } from 'zod';

/**
 * Strong password validation matching @IsStrongPassword() from class-validator
 * Requires: at least 1 uppercase, 1 lowercase, 1 number, 1 special character
 * 
 * Note: @IsStrongPassword() accepts a wide range of special characters by default.
 * This regex matches the default behavior which accepts any printable ASCII special character.
 */
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must not exceed 50 characters'),
    surname: z
      .string()
      .min(2, 'Surname must be at least 2 characters')
      .max(50, 'Surname must not exceed 50 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must not exceed 20 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(30, 'Password must not exceed 30 characters')
      .regex(
        strongPasswordRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

