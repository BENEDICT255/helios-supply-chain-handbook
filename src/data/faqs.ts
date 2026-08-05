import { FAQItem } from '@/types';

export const faqs: FAQItem[] = [
  {
    id: 1,
    question: 'How do I request goods or services?',
    answer:
      'Begin by clearly defining the requirement, confirming the available budget and preparing the necessary specifications or scope of work. Submit the request through the approved internal process before Supply Chain begins sourcing.',
    category: 'Requests',
  },
  {
    id: 2,
    question: 'When does the procurement timeline begin?',
    answer:
      'The procurement timeline normally begins when Supply Chain receives a complete and approved request with all required supporting information.',
    category: 'Timelines',
  },
  {
    id: 3,
    question: 'Why can delivery take longer than the published estimate?',
    answer:
      'Delivery may be affected by incomplete specifications, delayed approvals, supplier stock availability, importation, manufacturing schedules, technical complexity or changes to the original requirement.',
    category: 'Timelines',
  },
  {
    id: 4,
    question: 'Can I select my preferred supplier?',
    answer:
      'You may provide relevant supplier information where appropriate, but supplier selection must follow the approved procurement process and evaluation requirements.',
    category: 'Suppliers',
  },
  {
    id: 5,
    question: 'Why are quotations required?',
    answer:
      'Quotations support fair competition, price comparison, transparency and value-for-money decisions.',
    category: 'Sourcing',
  },
  {
    id: 6,
    question: 'What happens after my request is approved?',
    answer:
      'Supply Chain reviews the request, confirms the appropriate sourcing method, obtains quotations or proposals where required, completes the evaluation and issues the applicable purchase order or contract.',
    category: 'Process',
  },
  {
    id: 7,
    question: 'What information should I provide with my request?',
    answer:
      'Provide a clear description, complete specification or scope of work, required quantity, delivery location, business justification, budget information and any relevant supporting documents.',
    category: 'Requests',
  },
  {
    id: 8,
    question: 'How can I check the expected delivery time?',
    answer:
      'Use the Delivery Timelines page to search for the relevant item or service. The displayed lead time is indicative and may vary depending on the circumstances of the request.',
    category: 'Timelines',
  },
  {
    id: 9,
    question: 'Who should I contact if my question is not answered?',
    answer:
      'Use the Contact Supply Chain page to find the appropriate support details.',
    category: 'Support',
  },
];

export const faqCategories: string[] = [
  'Requests',
  'Timelines',
  'Process',
  'Sourcing',
  'Suppliers',
  'Support',
];
