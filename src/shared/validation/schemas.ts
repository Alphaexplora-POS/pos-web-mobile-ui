import { z } from 'zod';
import type { ZodError } from 'zod';

export const firstZodMessage = (error: ZodError): string =>
  error.issues.find((issue) => issue.message)?.message ?? 'Invalid input';

export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters').max(255, 'Branch name is too long'),
  address: z.string().max(500, 'Address is too long'),
  contactNumber: z.string().max(50, 'Contact number is too long'),
});

export const employeeSchema = z
  .object({
    name: z.string().min(1, 'Please enter an employee name'),
    role: z.enum(['branch_manager', 'supervisor', 'cashier', 'staff']),
    branchId: z.string().min(1, 'Please provide a valid branch'),
    pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    email: z.string().optional(),
    password: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === 'branch_manager' && (!value.email || !value.password)) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: 'Email and password are required for a Branch Manager' });
    }
  });

export const categorySchema = z.object({
  name: z.string().min(1, 'Please enter a category name').max(200, 'Category name is too long'),
});

export const productSchema = z
  .object({
    categoryId: z.string().min(1, 'Please choose a valid category'),
    name: z.string().min(1, 'Please enter a product name').max(255, 'Product name is too long'),
    description: z.string().max(1000, 'Description is too long'),
    basePrice: z.number('Please enter a valid price').nonnegative('Price cannot be negative'),
    imageUrl: z.string().max(1000, 'Image URL is too long'),
  })
  .refine((value) => Number.isFinite(value.basePrice), { message: 'Please enter a valid price', path: ['basePrice'] });

export const variantSchema = z.object({
  branchId: z.string().min(1, 'Please provide a valid branch'),
  sku: z.string().min(1, 'Please enter a SKU').max(100, 'SKU is too long'),
  size: z.string().max(50, 'Size is too long').nullable().optional(),
  color: z.string().max(50, 'Color is too long').nullable().optional(),
  priceOverride: z.number('Please enter a valid price').nonnegative('Price cannot be negative').optional(),
  costPrice: z.number('Please enter a valid price').nonnegative('Price cannot be negative').optional(),
});

export const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Please enter a payment method name').max(100, 'Payment method name is too long'),
  type: z.string().min(1, 'Please enter a payment type').max(50, 'Payment type is too long'),
});

export const reasonCodeSchema = z.object({
  label: z.string().min(1, 'Please enter a label').max(200, 'Label is too long'),
  type: z.enum(['refund', 'inventory']),
});