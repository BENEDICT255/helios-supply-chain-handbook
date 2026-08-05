import { z } from 'zod';

export const procurementStepSchema = z.object({
  step_number: z.number().int().min(1, 'Step number must be at least 1'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  responsible_party: z.string().default(''),
  expected_duration: z.string().default(''),
  notes: z.string().default(''),
  status: z.enum(['published', 'draft']).default('draft'),
  display_order: z.number().int().min(0).default(0),
});

export type ProcurementStepFormData = z.infer<typeof procurementStepSchema>;
