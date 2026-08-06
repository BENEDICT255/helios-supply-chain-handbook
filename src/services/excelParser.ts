import * as XLSX from 'xlsx';

export interface ValidationErrorItem {
  sheet: string;
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParsedDeliveryTimelineRow {
  rowIndex: number;
  id?: string;
  department: string;
  category: string;
  item: string;
  estimatedLeadTime: string;
  requirements: string;
  notes: string;
  status: 'published' | 'draft';
  displayOrder: number;
  isValid: boolean;
}

export interface ParsedProcurementStepRow {
  rowIndex: number;
  id?: string;
  stepNumber: number;
  title: string;
  description: string;
  responsibleParty: string;
  expectedDuration: string;
  notes: string;
  status: 'published' | 'draft';
  displayOrder: number;
  isValid: boolean;
}

export interface ValidationSummary {
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
  workbookVersion: string;
  totalDeliveryRows: number;
  validDeliveryRows: number;
  totalProcurementRows: number;
  validProcurementRows: number;
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
  hasBlockingErrors: boolean;
  parsedDeliveryRows: ParsedDeliveryTimelineRow[];
  parsedProcurementRows: ParsedProcurementStepRow[];
}

const APPROVED_DEPARTMENTS = [
  'Information Technology',
  'Administration',
  'Network Operations',
  'Fleet',
  'Health, Safety and Environment',
  'Professional Services',
];

const APPROVED_STATUSES = ['published', 'draft'];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Checks if a string value begins with formula trigger characters.
 */
export function isFormulaCell(cellValue: unknown): boolean {
  if (typeof cellValue !== 'string') return false;
  const trimmed = cellValue.trim();
  return /^[=+\-@]/.test(trimmed) && !trimmed.startsWith("'");
}

/**
 * Strictly parses and validates an uploaded Excel buffer.
 */
export function parseAndValidateWorkbook(
  buffer: Buffer,
  fileName: string
): ValidationSummary {
  const errors: ValidationErrorItem[] = [];
  const warnings: ValidationErrorItem[] = [];
  const parsedDeliveryRows: ParsedDeliveryTimelineRow[] = [];
  const parsedProcurementRows: ParsedProcurementStepRow[] = [];

  const fileSizeBytes = buffer.length;
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  if (fileSizeBytes > maxSizeBytes) {
    errors.push({
      sheet: 'File',
      row: 0,
      column: 'Size',
      message: `File size exceeds maximum permitted limit of 5 MB (Uploaded: ${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)`,
      severity: 'error',
    });
  }

  if (!fileName.toLowerCase().endsWith('.xlsx')) {
    errors.push({
      sheet: 'File',
      row: 0,
      column: 'Extension',
      message: 'Only .xlsx workbooks are permitted. .xls, .csv, and other formats are rejected.',
      severity: 'error',
    });
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    errors.push({
      sheet: 'Workbook',
      row: 0,
      column: 'Structure',
      message: `Workbook could not be parsed: ${err instanceof Error ? err.message : 'Corrupted file'}`,
      severity: 'error',
    });

    return {
      fileName,
      fileSizeBytes,
      uploadedAt: new Date().toISOString(),
      workbookVersion: '1.0',
      totalDeliveryRows: 0,
      validDeliveryRows: 0,
      totalProcurementRows: 0,
      validProcurementRows: 0,
      errors,
      warnings,
      hasBlockingErrors: true,
      parsedDeliveryRows: [],
      parsedProcurementRows: [],
    };
  }

  // Validate required sheets
  const requiredSheets = ['Instructions', 'Delivery Timelines', 'Procurement Process', 'Reference Data'];
  for (const sheetName of requiredSheets) {
    if (!workbook.SheetNames.includes(sheetName)) {
      errors.push({
        sheet: 'Workbook',
        row: 0,
        column: 'Sheets',
        message: `Missing required worksheet: "${sheetName}"`,
        severity: 'error',
      });
    }
  }

  if (errors.length > 0) {
    return {
      fileName,
      fileSizeBytes,
      uploadedAt: new Date().toISOString(),
      workbookVersion: '1.0',
      totalDeliveryRows: 0,
      validDeliveryRows: 0,
      totalProcurementRows: 0,
      validProcurementRows: 0,
      errors,
      warnings,
      hasBlockingErrors: true,
      parsedDeliveryRows: [],
      parsedProcurementRows: [],
    };
  }

  // ----------------------------------------------------
  // Validate Delivery Timelines Sheet
  // ----------------------------------------------------
  const deliverySheet = workbook.Sheets['Delivery Timelines'];
  const deliveryRaw: (string | number)[][] = XLSX.utils.sheet_to_json(deliverySheet, { header: 1 });

  const expectedDeliveryCols = [
    'Record ID',
    'Department',
    'Category',
    'Item or Service',
    'Estimated Lead Time',
    'Requirements',
    'Notes',
    'Status',
    'Display Order',
  ];

  if (deliveryRaw.length === 0) {
    errors.push({
      sheet: 'Delivery Timelines',
      row: 1,
      column: 'Headers',
      message: 'Delivery Timelines sheet is completely empty.',
      severity: 'error',
    });
  } else {
    const headers = (deliveryRaw[0] || []).map((h) => String(h || '').trim());
    for (let i = 0; i < expectedDeliveryCols.length; i++) {
      if (headers[i] !== expectedDeliveryCols[i]) {
        errors.push({
          sheet: 'Delivery Timelines',
          row: 1,
          column: `Col ${i + 1}`,
          message: `Column heading mismatch at position ${i + 1}. Expected "${expectedDeliveryCols[i]}", found "${headers[i] || ''}"`,
          severity: 'error',
        });
      }
    }
  }

  // Row limits check
  const deliveryDataRows = deliveryRaw.slice(1);
  if (deliveryDataRows.length > 5000) {
    errors.push({
      sheet: 'Delivery Timelines',
      row: 0,
      column: 'Rows',
      message: `Delivery Timelines rows (${deliveryDataRows.length}) exceed maximum allowed limit of 5,000.`,
      severity: 'error',
    });
  }

  const seenDeliveryIds = new Set<string>();

  deliveryDataRows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-indexed including header
    if (!row || row.every((cell) => cell === undefined || cell === null || String(cell).trim() === '')) {
      return; // Skip empty rows
    }

    let rowIsValid = true;

    const rawId = String(row[0] || '').trim();
    const department = String(row[1] || '').trim();
    const category = String(row[2] || '').trim();
    const item = String(row[3] || '').trim();
    const estimatedLeadTime = String(row[4] || '').trim();
    const requirements = String(row[5] || '').trim();
    const notes = String(row[6] || '').trim();
    const status = String(row[7] || '').trim().toLowerCase();
    const rawDisplayOrder = row[8];

    // Check for raw formulas
    row.forEach((cell, colIdx) => {
      if (isFormulaCell(cell)) {
        errors.push({
          sheet: 'Delivery Timelines',
          row: rowNum,
          column: expectedDeliveryCols[colIdx] || `Col ${colIdx + 1}`,
          message: 'Formula values (starting with =, +, -, @) are strictly prohibited.',
          severity: 'error',
        });
        rowIsValid = false;
      }
    });

    // Record ID validation
    let id: string | undefined = undefined;
    if (rawId) {
      if (!UUID_REGEX.test(rawId)) {
        errors.push({
          sheet: 'Delivery Timelines',
          row: rowNum,
          column: 'Record ID',
          message: `Invalid Record ID format "${rawId}". Record ID must be a valid UUID or left blank for new items.`,
          severity: 'error',
        });
        rowIsValid = false;
      } else if (seenDeliveryIds.has(rawId)) {
        errors.push({
          sheet: 'Delivery Timelines',
          row: rowNum,
          column: 'Record ID',
          message: `Duplicate Record ID "${rawId}" found in sheet.`,
          severity: 'error',
        });
        rowIsValid = false;
      } else {
        id = rawId;
        seenDeliveryIds.add(rawId);
      }
    }

    // Required Fields & Lengths
    if (!department) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Department',
        message: 'Department is required.',
        severity: 'error',
      });
      rowIsValid = false;
    } else if (department.length > 100) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Department',
        message: 'Department exceeds maximum length of 100 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    } else if (!APPROVED_DEPARTMENTS.includes(department)) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Department',
        message: `"${department}" is not an approved department. Must be one of: ${APPROVED_DEPARTMENTS.join(', ')}`,
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (!category) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Category',
        message: 'Category is required.',
        severity: 'error',
      });
      rowIsValid = false;
    } else if (category.length > 150) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Category',
        message: 'Category exceeds maximum length of 150 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (!item) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Item or Service',
        message: 'Item or Service name is required.',
        severity: 'error',
      });
      rowIsValid = false;
    } else if (item.length > 200) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Item or Service',
        message: 'Item name exceeds maximum length of 200 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (!estimatedLeadTime) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Estimated Lead Time',
        message: 'Estimated Lead Time is required.',
        severity: 'error',
      });
      rowIsValid = false;
    } else if (estimatedLeadTime.length > 100) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Estimated Lead Time',
        message: 'Estimated Lead Time exceeds maximum length of 100 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (requirements.length > 2000) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Requirements',
        message: 'Requirements exceeds maximum length of 2,000 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (notes.length > 2000) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Notes',
        message: 'Notes exceeds maximum length of 2,000 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (!status || !APPROVED_STATUSES.includes(status)) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Status',
        message: `Status "${status}" is invalid. Must be "published" or "draft".`,
        severity: 'error',
      });
      rowIsValid = false;
    }

    const displayOrder = parseInt(String(rawDisplayOrder ?? 0), 10);
    if (isNaN(displayOrder) || displayOrder < 0) {
      errors.push({
        sheet: 'Delivery Timelines',
        row: rowNum,
        column: 'Display Order',
        message: 'Display Order must be a positive whole number.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    parsedDeliveryRows.push({
      rowIndex: rowNum,
      id,
      department,
      category,
      item,
      estimatedLeadTime,
      requirements,
      notes,
      status: (status as 'published' | 'draft') || 'draft',
      displayOrder: isNaN(displayOrder) ? 0 : displayOrder,
      isValid: rowIsValid,
    });
  });

  // ----------------------------------------------------
  // Validate Procurement Process Sheet
  // ----------------------------------------------------
  const procurementSheet = workbook.Sheets['Procurement Process'];
  const procurementRaw: (string | number)[][] = XLSX.utils.sheet_to_json(procurementSheet, { header: 1 });

  const expectedProcurementCols = [
    'Record ID',
    'Step Number',
    'Title',
    'Description',
    'Responsible Party',
    'Expected Duration',
    'Notes',
    'Status',
    'Display Order',
  ];

  if (procurementRaw.length === 0) {
    errors.push({
      sheet: 'Procurement Process',
      row: 1,
      column: 'Headers',
      message: 'Procurement Process sheet is completely empty.',
      severity: 'error',
    });
  } else {
    const headers = (procurementRaw[0] || []).map((h) => String(h || '').trim());
    for (let i = 0; i < expectedProcurementCols.length; i++) {
      if (headers[i] !== expectedProcurementCols[i]) {
        errors.push({
          sheet: 'Procurement Process',
          row: 1,
          column: `Col ${i + 1}`,
          message: `Column heading mismatch at position ${i + 1}. Expected "${expectedProcurementCols[i]}", found "${headers[i] || ''}"`,
          severity: 'error',
        });
      }
    }
  }

  const procurementDataRows = procurementRaw.slice(1);
  if (procurementDataRows.length > 500) {
    errors.push({
      sheet: 'Procurement Process',
      row: 0,
      column: 'Rows',
      message: `Procurement Process rows (${procurementDataRows.length}) exceed maximum allowed limit of 500.`,
      severity: 'error',
    });
  }

  const seenProcurementIds = new Set<string>();

  procurementDataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    if (!row || row.every((cell) => cell === undefined || cell === null || String(cell).trim() === '')) {
      return;
    }

    let rowIsValid = true;

    const rawId = String(row[0] || '').trim();
    const rawStepNumber = row[1];
    const title = String(row[2] || '').trim();
    const description = String(row[3] || '').trim();
    const responsibleParty = String(row[4] || '').trim();
    const expectedDuration = String(row[5] || '').trim();
    const notes = String(row[6] || '').trim();
    const status = String(row[7] || '').trim().toLowerCase();
    const rawDisplayOrder = row[8];

    // Formula check
    row.forEach((cell, colIdx) => {
      if (isFormulaCell(cell)) {
        errors.push({
          sheet: 'Procurement Process',
          row: rowNum,
          column: expectedProcurementCols[colIdx] || `Col ${colIdx + 1}`,
          message: 'Formula values (starting with =, +, -, @) are strictly prohibited.',
          severity: 'error',
        });
        rowIsValid = false;
      }
    });

    let id: string | undefined = undefined;
    if (rawId) {
      if (!UUID_REGEX.test(rawId)) {
        errors.push({
          sheet: 'Procurement Process',
          row: rowNum,
          column: 'Record ID',
          message: `Invalid Record ID format "${rawId}". Must be a valid UUID or left blank for new steps.`,
          severity: 'error',
        });
        rowIsValid = false;
      } else if (seenProcurementIds.has(rawId)) {
        errors.push({
          sheet: 'Procurement Process',
          row: rowNum,
          column: 'Record ID',
          message: `Duplicate Record ID "${rawId}" found in sheet.`,
          severity: 'error',
        });
        rowIsValid = false;
      } else {
        id = rawId;
        seenProcurementIds.add(rawId);
      }
    }

    const stepNumber = parseInt(String(rawStepNumber ?? 0), 10);
    if (isNaN(stepNumber) || stepNumber < 1) {
      errors.push({
        sheet: 'Procurement Process',
        row: rowNum,
        column: 'Step Number',
        message: 'Step Number must be a positive whole number (1 or greater).',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (!title) {
      errors.push({
        sheet: 'Procurement Process',
        row: rowNum,
        column: 'Title',
        message: 'Step Title is required.',
        severity: 'error',
      });
      rowIsValid = false;
    } else if (title.length > 200) {
      errors.push({
        sheet: 'Procurement Process',
        row: rowNum,
        column: 'Title',
        message: 'Step Title exceeds maximum length of 200 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (!description) {
      errors.push({
        sheet: 'Procurement Process',
        row: rowNum,
        column: 'Description',
        message: 'Step Description is required.',
        severity: 'error',
      });
      rowIsValid = false;
    } else if (description.length > 3000) {
      errors.push({
        sheet: 'Procurement Process',
        row: rowNum,
        column: 'Description',
        message: 'Description exceeds maximum length of 3,000 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (responsibleParty.length > 200) {
      errors.push({
        sheet: 'Procurement Process',
        row: rowNum,
        column: 'Responsible Party',
        message: 'Responsible Party exceeds maximum length of 200 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (expectedDuration.length > 100) {
      errors.push({
        sheet: 'Procurement Process',
        row: rowNum,
        column: 'Expected Duration',
        message: 'Expected Duration exceeds maximum length of 100 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (notes.length > 2000) {
      errors.push({
        sheet: 'Procurement Process',
        row: rowNum,
        column: 'Notes',
        message: 'Notes exceeds maximum length of 2,000 characters.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    if (!status || !APPROVED_STATUSES.includes(status)) {
      errors.push({
        sheet: 'Procurement Process',
        row: rowNum,
        column: 'Status',
        message: `Status "${status}" is invalid. Must be "published" or "draft".`,
        severity: 'error',
      });
      rowIsValid = false;
    }

    const displayOrder = parseInt(String(rawDisplayOrder ?? 0), 10);
    if (isNaN(displayOrder) || displayOrder < 0) {
      errors.push({
        sheet: 'Procurement Process',
        row: rowNum,
        column: 'Display Order',
        message: 'Display Order must be a positive whole number.',
        severity: 'error',
      });
      rowIsValid = false;
    }

    parsedProcurementRows.push({
      rowIndex: rowNum,
      id,
      stepNumber: isNaN(stepNumber) ? 1 : stepNumber,
      title,
      description,
      responsibleParty,
      expectedDuration,
      notes,
      status: (status as 'published' | 'draft') || 'draft',
      displayOrder: isNaN(displayOrder) ? 0 : displayOrder,
      isValid: rowIsValid,
    });
  });

  const validDeliveryRows = parsedDeliveryRows.filter((r) => r.isValid).length;
  const validProcurementRows = parsedProcurementRows.filter((r) => r.isValid).length;
  const hasBlockingErrors = errors.length > 0;

  return {
    fileName,
    fileSizeBytes,
    uploadedAt: new Date().toISOString(),
    workbookVersion: '1.0',
    totalDeliveryRows: parsedDeliveryRows.length,
    validDeliveryRows,
    totalProcurementRows: parsedProcurementRows.length,
    validProcurementRows,
    errors,
    warnings,
    hasBlockingErrors,
    parsedDeliveryRows,
    parsedProcurementRows,
  };
}
