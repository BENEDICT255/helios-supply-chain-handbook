import { z } from 'zod';

export const faqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['published', 'draft']).default('draft'),
  display_order: z.number().int().min(0).default(0),
});

export type FaqFormData = z.infer<typeof faqSchema>;
