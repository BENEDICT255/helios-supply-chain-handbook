import { z } from 'zod';

export const deliveryTimelineSchema = z.object({
  department: z.string().min(1, 'Department is required'),
  category: z.string().min(1, 'Category is required'),
  item: z.string().min(1, 'Item name is required'),
  estimated_lead_time: z.string().min(1, 'Estimated lead time is required'),
  requirements: z.string().default(''),
  notes: z.string().default(''),
  status: z.enum(['published', 'draft']).default('draft'),
  display_order: z.number().int().min(0).default(0),
});

export type DeliveryTimelineFormData = z.infer<typeof deliveryTimelineSchema>;
