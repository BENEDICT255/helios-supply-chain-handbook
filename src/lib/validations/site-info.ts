import { z } from 'zod';

export const siteInfoSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  last_updated: z.string().min(1, 'Last updated is required'),
  contact_email: z.string().email('Valid email is required'),
  office: z.string().default(''),
  working_hours: z.string().default(''),
  homepage_notice: z.string().default(''),
  support_message: z.string().default(''),
});

export type SiteInfoFormData = z.infer<typeof siteInfoSchema>;
