import type { DbDeliveryTimeline, DbProcurementStep } from '@/types/database';
import type { ParsedDeliveryTimelineRow, ParsedProcurementStepRow } from './excelParser';

export interface FieldDiff {
  field: string;
  fieldLabel: string;
  oldValue: string | number;
  newValue: string | number;
}

export interface DeliveryTimelineDiffItem {
  type: 'insert' | 'update' | 'unchanged' | 'missing';
  parsedRow?: ParsedDeliveryTimelineRow;
  dbRecord?: DbDeliveryTimeline;
  diffs: FieldDiff[];
  userChoice?: 'keep' | 'unpublish' | 'delete'; // Choice for missing records
}

export interface ProcurementStepDiffItem {
  type: 'insert' | 'update' | 'unchanged' | 'missing';
  parsedRow?: ParsedProcurementStepRow;
  dbRecord?: DbProcurementStep;
  diffs: FieldDiff[];
  userChoice?: 'keep' | 'unpublish' | 'delete'; // Choice for missing records
}

export interface WorkbookDiffSummary {
  deliveryTimelines: DeliveryTimelineDiffItem[];
  procurementSteps: ProcurementStepDiffItem[];
  proposedInserts: number;
  proposedUpdates: number;
  proposedUnpublishes: number;
  proposedDeletes: number;
  unchangedCount: number;
}

/**
 * Computes field-level diffs between parsed workbook rows and live database records.
 */
export function computeWorkbookDiffs(params: {
  parsedDeliveryRows: ParsedDeliveryTimelineRow[];
  parsedProcurementRows: ParsedProcurementStepRow[];
  dbDeliveryTimelines: DbDeliveryTimeline[];
  dbProcurementSteps: DbProcurementStep[];
  missingRowChoices?: Record<string, 'keep' | 'unpublish' | 'delete'>; // Keyed by record ID
}): WorkbookDiffSummary {
  const {
    parsedDeliveryRows,
    parsedProcurementRows,
    dbDeliveryTimelines,
    dbProcurementSteps,
    missingRowChoices = {},
  } = params;

  const dbDeliveryMap = new Map<string, DbDeliveryTimeline>();
  dbDeliveryTimelines.forEach((t) => dbDeliveryMap.set(t.id, t));

  const dbProcurementMap = new Map<string, DbProcurementStep>();
  dbProcurementSteps.forEach((s) => dbProcurementMap.set(s.id, s));

  const deliveryDiffs: DeliveryTimelineDiffItem[] = [];
  const processedDeliveryIds = new Set<string>();

  // Process parsed delivery rows
  parsedDeliveryRows.forEach((row) => {
    if (!row.isValid) return;

    if (!row.id || !dbDeliveryMap.has(row.id)) {
      // New insert
      deliveryDiffs.push({
        type: 'insert',
        parsedRow: row,
        diffs: [
          { field: 'item', fieldLabel: 'Item or Service', oldValue: '', newValue: row.item },
          { field: 'department', fieldLabel: 'Department', oldValue: '', newValue: row.department },
          { field: 'category', fieldLabel: 'Category', oldValue: '', newValue: row.category },
          { field: 'estimated_lead_time', fieldLabel: 'Estimated Lead Time', oldValue: '', newValue: row.estimatedLeadTime },
          { field: 'status', fieldLabel: 'Status', oldValue: '', newValue: row.status },
        ],
      });
    } else {
      // Existing record — compare fields
      const existing = dbDeliveryMap.get(row.id)!;
      processedDeliveryIds.add(existing.id);

      const fieldDiffs: FieldDiff[] = [];

      if (existing.department !== row.department) {
        fieldDiffs.push({ field: 'department', fieldLabel: 'Department', oldValue: existing.department, newValue: row.department });
      }
      if (existing.category !== row.category) {
        fieldDiffs.push({ field: 'category', fieldLabel: 'Category', oldValue: existing.category, newValue: row.category });
      }
      if (existing.item !== row.item) {
        fieldDiffs.push({ field: 'item', fieldLabel: 'Item or Service', oldValue: existing.item, newValue: row.item });
      }
      if (existing.estimated_lead_time !== row.estimatedLeadTime) {
        fieldDiffs.push({ field: 'estimated_lead_time', fieldLabel: 'Estimated Lead Time', oldValue: existing.estimated_lead_time, newValue: row.estimatedLeadTime });
      }
      if ((existing.requirements || '') !== row.requirements) {
        fieldDiffs.push({ field: 'requirements', fieldLabel: 'Requirements', oldValue: existing.requirements || '', newValue: row.requirements });
      }
      if ((existing.notes || '') !== row.notes) {
        fieldDiffs.push({ field: 'notes', fieldLabel: 'Notes', oldValue: existing.notes || '', newValue: row.notes });
      }
      if (existing.status !== row.status) {
        fieldDiffs.push({ field: 'status', fieldLabel: 'Status', oldValue: existing.status, newValue: row.status });
      }
      if (existing.display_order !== row.displayOrder) {
        fieldDiffs.push({ field: 'display_order', fieldLabel: 'Display Order', oldValue: existing.display_order, newValue: row.displayOrder });
      }

      if (fieldDiffs.length > 0) {
        deliveryDiffs.push({
          type: 'update',
          parsedRow: row,
          dbRecord: existing,
          diffs: fieldDiffs,
        });
      } else {
        deliveryDiffs.push({
          type: 'unchanged',
          parsedRow: row,
          dbRecord: existing,
          diffs: [],
        });
      }
    }
  });

  // Identify missing delivery records
  dbDeliveryTimelines.forEach((t) => {
    if (!processedDeliveryIds.has(t.id)) {
      const choice = missingRowChoices[t.id] || 'keep';
      deliveryDiffs.push({
        type: 'missing',
        dbRecord: t,
        diffs: [],
        userChoice: choice,
      });
    }
  });

  // Process Procurement Steps
  const procurementDiffs: ProcurementStepDiffItem[] = [];
  const processedProcurementIds = new Set<string>();

  parsedProcurementRows.forEach((row) => {
    if (!row.isValid) return;

    if (!row.id || !dbProcurementMap.has(row.id)) {
      procurementDiffs.push({
        type: 'insert',
        parsedRow: row,
        diffs: [
          { field: 'step_number', fieldLabel: 'Step Number', oldValue: '', newValue: row.stepNumber },
          { field: 'title', fieldLabel: 'Step Title', oldValue: '', newValue: row.title },
          { field: 'description', fieldLabel: 'Description', oldValue: '', newValue: row.description },
          { field: 'expected_duration', fieldLabel: 'Expected Duration', oldValue: '', newValue: row.expectedDuration },
          { field: 'status', fieldLabel: 'Status', oldValue: '', newValue: row.status },
        ],
      });
    } else {
      const existing = dbProcurementMap.get(row.id)!;
      processedProcurementIds.add(existing.id);

      const fieldDiffs: FieldDiff[] = [];

      if (existing.step_number !== row.stepNumber) {
        fieldDiffs.push({ field: 'step_number', fieldLabel: 'Step Number', oldValue: existing.step_number, newValue: row.stepNumber });
      }
      if (existing.title !== row.title) {
        fieldDiffs.push({ field: 'title', fieldLabel: 'Title', oldValue: existing.title, newValue: row.title });
      }
      if (existing.description !== row.description) {
        fieldDiffs.push({ field: 'description', fieldLabel: 'Description', oldValue: existing.description, newValue: row.description });
      }
      if ((existing.responsible_party || '') !== row.responsibleParty) {
        fieldDiffs.push({ field: 'responsible_party', fieldLabel: 'Responsible Party', oldValue: existing.responsible_party || '', newValue: row.responsibleParty });
      }
      if ((existing.expected_duration || '') !== row.expectedDuration) {
        fieldDiffs.push({ field: 'expected_duration', fieldLabel: 'Expected Duration', oldValue: existing.expected_duration || '', newValue: row.expectedDuration });
      }
      if ((existing.notes || '') !== row.notes) {
        fieldDiffs.push({ field: 'notes', fieldLabel: 'Notes', oldValue: existing.notes || '', newValue: row.notes });
      }
      if (existing.status !== row.status) {
        fieldDiffs.push({ field: 'status', fieldLabel: 'Status', oldValue: existing.status, newValue: row.status });
      }
      if (existing.display_order !== row.displayOrder) {
        fieldDiffs.push({ field: 'display_order', fieldLabel: 'Display Order', oldValue: existing.display_order, newValue: row.displayOrder });
      }

      if (fieldDiffs.length > 0) {
        procurementDiffs.push({
          type: 'update',
          parsedRow: row,
          dbRecord: existing,
          diffs: fieldDiffs,
        });
      } else {
        procurementDiffs.push({
          type: 'unchanged',
          parsedRow: row,
          dbRecord: existing,
          diffs: [],
        });
      }
    }
  });

  dbProcurementSteps.forEach((s) => {
    if (!processedProcurementIds.has(s.id)) {
      const choice = missingRowChoices[s.id] || 'keep';
      procurementDiffs.push({
        type: 'missing',
        dbRecord: s,
        diffs: [],
        userChoice: choice,
      });
    }
  });

  // Calculate totals
  const proposedInserts =
    deliveryDiffs.filter((d) => d.type === 'insert').length +
    procurementDiffs.filter((p) => p.type === 'insert').length;

  const proposedUpdates =
    deliveryDiffs.filter((d) => d.type === 'update').length +
    procurementDiffs.filter((p) => p.type === 'update').length;

  const proposedUnpublishes =
    deliveryDiffs.filter((d) => d.type === 'missing' && d.userChoice === 'unpublish').length +
    procurementDiffs.filter((p) => p.type === 'missing' && p.userChoice === 'unpublish').length;

  const proposedDeletes =
    deliveryDiffs.filter((d) => d.type === 'missing' && d.userChoice === 'delete').length +
    procurementDiffs.filter((p) => p.type === 'missing' && p.userChoice === 'delete').length;

  const unchangedCount =
    deliveryDiffs.filter((d) => d.type === 'unchanged' || (d.type === 'missing' && d.userChoice === 'keep')).length +
    procurementDiffs.filter((p) => p.type === 'unchanged' || (p.type === 'missing' && p.userChoice === 'keep')).length;

  return {
    deliveryTimelines: deliveryDiffs,
    procurementSteps: procurementDiffs,
    proposedInserts,
    proposedUpdates,
    proposedUnpublishes,
    proposedDeletes,
    unchangedCount,
  };
}
