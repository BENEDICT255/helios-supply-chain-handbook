import { ProcurementStep } from '@/types';

export const procurementSteps: ProcurementStep[] = [
  {
    id: 1,
    title: 'Identify the Requirement',
    description:
      'The requester identifies the goods or services required and defines the business need.',
    responsibleParty: 'Requester',
    expectedDuration: '1 working day',
  },
  {
    id: 2,
    title: 'Prepare the Request',
    description:
      'The requester prepares the required specifications, scope of work, supporting documents and budget information.',
    responsibleParty: 'Requester',
    expectedDuration: '1–3 working days',
  },
  {
    id: 3,
    title: 'Obtain Approval',
    description:
      'The request is reviewed and approved in accordance with the applicable approval process.',
    responsibleParty: 'Approver',
    expectedDuration: '1–3 working days',
  },
  {
    id: 4,
    title: 'Procurement Review',
    description:
      'Supply Chain checks the request for completeness, confirms the sourcing approach and requests clarification where necessary.',
    responsibleParty: 'Supply Chain',
    expectedDuration: '1–2 working days',
  },
  {
    id: 5,
    title: 'Supplier Sourcing',
    description:
      'Quotations, proposals or tender responses are obtained and evaluated according to the procurement method.',
    responsibleParty: 'Supply Chain and evaluation team',
    expectedDuration: 'Depends on procurement method',
  },
  {
    id: 6,
    title: 'Purchase Order or Contract',
    description:
      'The selected supplier is formally engaged through an approved purchase order or contract.',
    responsibleParty: 'Supply Chain',
    expectedDuration: '1–5 working days',
  },
  {
    id: 7,
    title: 'Supplier Delivery',
    description:
      'The supplier prepares and delivers the goods or performs the approved services.',
    responsibleParty: 'Supplier',
    expectedDuration: 'Depends on item or service',
  },
  {
    id: 8,
    title: 'Receipt and Confirmation',
    description:
      'The goods or services are inspected, received and confirmed by the responsible team.',
    responsibleParty: 'Requester or receiving team',
    expectedDuration: '1–2 working days',
  },
];
