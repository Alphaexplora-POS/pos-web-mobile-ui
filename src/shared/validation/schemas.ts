import { z } from 'zod';
import type { ZodError } from 'zod';

const RAW_TYPE_MESSAGE = /^Invalid input: expected /;

export const firstZodMessage = (error: ZodError): string => {
  const issue = error.issues[0];
  if (!issue) return 'Invalid input';
  if (!RAW_TYPE_MESSAGE.test(issue.message ?? '')) return issue.message ?? 'Invalid input';
  const received = 'received' in issue ? issue.received : undefined;
  if (received === 'undefined' || received === 'null') {
    return 'This field is required';
  }
  const field = issue.path.join('.');
  return `Please provide a valid value${field ? ` for ${field}` : ''}`;
};

export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters').max(255, 'Branch name is too long'),
  address: z.string().max(500, 'Address is too long'),
  contactNumber: z.string().max(50, 'Contact number is too long'),
});

export const employeeSchema = z
  .object({
    name: z.string().min(1, 'Please enter an employee name'),
    role: z.enum(['branch_manager', 'supervisor', 'cashier', 'staff']),
branchId: z.string({ error: 'Please provide a valid branch' }).min(1, 'Please provide a valid branch'),
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
  })
  .refine((value) => Number.isFinite(value.basePrice), { message: 'Please enter a valid price', path: ['basePrice'] });

export const variantSchema = z.object({
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