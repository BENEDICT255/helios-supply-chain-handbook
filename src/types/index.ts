export interface NavigationItem {
  label: string;
  href: string;
}

export interface ProcurementStep {
  id: number;
  title: string;
  description: string;
  responsibleParty: string;
  expectedDuration: string;
}

export interface DeliveryTimelineItem {
  id: number;
  department: string;
  category: string;
  item: string;
  estimatedLeadTime: string;
  requirements: string;
  notes: string;
  status: 'published' | 'draft';
  displayOrder: number;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export interface SiteInfo {
  title: string;
  description: string;
  version: string;
  lastUpdated: string;
  disclaimer: string;
}
