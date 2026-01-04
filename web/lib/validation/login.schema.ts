/**
 * Login form validation schema
 * Validation rules match backend DTO exactly:
 * - LoginDto from common/dtos/user/user.login.dto.ts
 */

import { z } from 'zod';

export const loginSchema = z.object({
  login: z
    .string()
    .min(3, 'Login must be at least 3 characters')
    .max(255, 'Login must not exceed 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(200, 'Password must not exceed 200 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

