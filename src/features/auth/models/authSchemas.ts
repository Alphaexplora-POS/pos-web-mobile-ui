import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address').max(255, 'Email is too long'),
  password: z.string().min(1, 'Please enter your password').max(255, 'Password is too long'),
});
export type LoginFields = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(255, 'Business name is too long'),
  businessType: z.string().min(2, 'Please enter a business type').max(100, 'Business type is too long'),
  firstName: z.string().min(1, 'Please enter a first name').max(255, 'First name is too long'),
  lastName: z.string().min(1, 'Please enter a last name').max(255, 'Last name is too long'),
  email: z.email('Please enter a valid email address').max(255, 'Email is too long'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(255, 'Password is too long'),
});
export type RegisterFields = z.infer<typeof registerSchema>;