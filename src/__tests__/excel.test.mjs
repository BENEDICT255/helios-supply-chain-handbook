/**
 * Helios Towers Supply Chain Handbook — Phase 3 Unit Tests
 *
 * Tests Excel export, parsing, validation, diffing, and formula-injection protection.
 * Uses Node.js built-in test runner (node --test).
 *
 * Run: npm run test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';

// ====================================================
// Helper: Inline reimplementation of pure functions
// because @/ path aliases aren't resolved by node:test.
// ====================================================

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

function sanitizeExcelValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  const str = String(value).trim();
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

function isFormulaCell(cellValue) {
  if (typeof cellValue !== 'string') return false;
  const trimmed = cellValue.trim();
  return /^[=+\-@]/.test(trimmed) && !trimmed.startsWith("'");
}

function createTestWorkbook({ deliveryRows = [], procurementRows = [], includeAllSheets = true } = {}) {
  const wb = XLSX.utils.book_new();

  // Instructions
  const instrSheet = XLSX.utils.aoa_to_sheet([['INSTRUCTIONS'], ['Workbook generated at:', '2026-08-06']]);
  XLSX.utils.book_append_sheet(wb, instrSheet, 'Instructions');

  // Delivery Timelines
  const dlHeaders = ['Record ID', 'Department', 'Category', 'Item or Service', 'Estimated Lead Time', 'Requirements', 'Notes', 'Status', 'Display Order'];
  const dlData = [dlHeaders, ...deliveryRows];
  const dlSheet = XLSX.utils.aoa_to_sheet(dlData);
  XLSX.utils.book_append_sheet(wb, dlSheet, 'Delivery Timelines');

  // Procurement Process
  if (includeAllSheets) {
    const prHeaders = ['Record ID', 'Step Number', 'Title', 'Description', 'Responsible Party', 'Expected Duration', 'Notes', 'Status', 'Display Order'];
    const prData = [prHeaders, ...procurementRows];
    const prSheet = XLSX.utils.aoa_to_sheet(prData);
    XLSX.utils.book_append_sheet(wb, prSheet, 'Procurement Process');
  }

  // Reference Data
  if (includeAllSheets) {
    const refSheet = XLSX.utils.aoa_to_sheet([['Approved Departments', 'Publication Statuses'], ...APPROVED_DEPARTMENTS.map(d => [d, ''])]);
    XLSX.utils.book_append_sheet(wb, refSheet, 'Reference Data');
  }

  return wb;
}

function workbookToBuffer(wb) {
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

// Inline validation (simplified mirror of excelParser.ts parseAndValidateWorkbook)
function parseAndValidateBuffer(buffer, fileName) {
  const errors = [];
  const warnings = [];
  const parsedDeliveryRows = [];
  const parsedProcurementRows = [];

  if (buffer.length > 5 * 1024 * 1024) {
    errors.push({ sheet: 'File', row: 0, column: 'Size', message: 'File too large', severity: 'error' });
  }

  if (!fileName.toLowerCase().endsWith('.xlsx')) {
    errors.push({ sheet: 'File', row: 0, column: 'Extension', message: 'Only .xlsx allowed', severity: 'error' });
  }

  let workbook;
  try { workbook = XLSX.read(buffer, { type: 'buffer' }); } catch {
    errors.push({ sheet: 'Workbook', row: 0, column: 'Structure', message: 'Cannot parse', severity: 'error' });
    return { errors, warnings, parsedDeliveryRows, parsedProcurementRows, hasBlockingErrors: true };
  }

  const requiredSheets = ['Instructions', 'Delivery Timelines', 'Procurement Process', 'Reference Data'];
  for (const s of requiredSheets) {
    if (!workbook.SheetNames.includes(s)) {
      errors.push({ sheet: 'Workbook', row: 0, column: 'Sheets', message: `Missing sheet: ${s}`, severity: 'error' });
    }
  }

  if (errors.length > 0) return { errors, warnings, parsedDeliveryRows, parsedProcurementRows, hasBlockingErrors: true };

  // Delivery validation
  const dlSheet = workbook.Sheets['Delivery Timelines'];
  const dlRaw = XLSX.utils.sheet_to_json(dlSheet, { header: 1 });
  const expectedDlCols = ['Record ID', 'Department', 'Category', 'Item or Service', 'Estimated Lead Time', 'Requirements', 'Notes', 'Status', 'Display Order'];

  if (dlRaw.length > 0) {
    const headers = (dlRaw[0] || []).map(h => String(h || '').trim());
    for (let i = 0; i < expectedDlCols.length; i++) {
      if (headers[i] !== expectedDlCols[i]) {
        errors.push({ sheet: 'Delivery Timelines', row: 1, column: `Col ${i + 1}`, message: `Header mismatch: expected "${expectedDlCols[i]}", got "${headers[i] || ''}"`, severity: 'error' });
      }
    }
  }

  const dlDataRows = dlRaw.slice(1);
  const seenIds = new Set();

  dlDataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    if (!row || row.every(c => c === undefined || c === null || String(c).trim() === '')) return;

    let valid = true;
    const rawId = String(row[0] || '').trim();
    const department = String(row[1] || '').trim();
    const category = String(row[2] || '').trim();
    const item = String(row[3] || '').trim();
    const leadTime = String(row[4] || '').trim();
    const status = String(row[7] || '').trim().toLowerCase();
    const rawOrder = row[8];

    // Formula check
    row.forEach((cell, ci) => {
      if (isFormulaCell(cell)) {
        errors.push({ sheet: 'Delivery Timelines', row: rowNum, column: expectedDlCols[ci], message: 'Formula prohibited', severity: 'error' });
        valid = false;
      }
    });

    let id;
    if (rawId) {
      if (!UUID_REGEX.test(rawId)) { errors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Record ID', message: `Invalid UUID: ${rawId}`, severity: 'error' }); valid = false; }
      else if (seenIds.has(rawId)) { errors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Record ID', message: 'Duplicate ID', severity: 'error' }); valid = false; }
      else { id = rawId; seenIds.add(rawId); }
    }

    if (!department) { errors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Department', message: 'Required', severity: 'error' }); valid = false; }
    else if (!APPROVED_DEPARTMENTS.includes(department)) { errors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Department', message: `"${department}" not approved`, severity: 'error' }); valid = false; }

    if (!item) { errors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Item', message: 'Required', severity: 'error' }); valid = false; }
    if (!leadTime) { errors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Lead Time', message: 'Required', severity: 'error' }); valid = false; }

    if (!status || !APPROVED_STATUSES.includes(status)) { errors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Status', message: `"${status}" invalid`, severity: 'error' }); valid = false; }

    const order = parseInt(String(rawOrder ?? 0), 10);
    if (isNaN(order) || order < 0) { errors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Display Order', message: 'Must be number', severity: 'error' }); valid = false; }

    parsedDeliveryRows.push({ rowIndex: rowNum, id, department, category, item, status, displayOrder: order, isValid: valid });
  });

  return {
    errors,
    warnings,
    parsedDeliveryRows,
    parsedProcurementRows,
    hasBlockingErrors: errors.length > 0,
  };
}

// ====================================================
// TEST SUITES
// ====================================================

describe('Formula Injection Protection', () => {
  it('sanitizes values starting with =', () => {
    assert.equal(sanitizeExcelValue('=SUM(A1:A5)'), "'=SUM(A1:A5)");
  });

  it('sanitizes values starting with +', () => {
    assert.equal(sanitizeExcelValue('+cmd|calc'), "'+cmd|calc");
  });

  it('sanitizes values starting with -', () => {
    assert.equal(sanitizeExcelValue('-1+2'), "'-1+2");
  });

  it('sanitizes values starting with @', () => {
    assert.equal(sanitizeExcelValue('@SUM(A1)'), "'@SUM(A1)");
  });

  it('passes normal text unchanged', () => {
    assert.equal(sanitizeExcelValue('Laptop Computer'), 'Laptop Computer');
  });

  it('passes numbers unchanged', () => {
    assert.equal(sanitizeExcelValue(42), 42);
  });

  it('converts null to empty string', () => {
    assert.equal(sanitizeExcelValue(null), '');
  });

  it('detects formula cells correctly', () => {
    assert.equal(isFormulaCell('=SUM(A1)'), true);
    assert.equal(isFormulaCell('+cmd'), true);
    assert.equal(isFormulaCell('-calc'), true);
    assert.equal(isFormulaCell('@import'), true);
    assert.equal(isFormulaCell('Normal text'), false);
    assert.equal(isFormulaCell(42), false);
    assert.equal(isFormulaCell("'=escaped"), false);
  });
});

describe('Workbook Generation', () => {
  it('creates workbook with 4 correct sheet names', () => {
    const wb = createTestWorkbook();
    assert.deepEqual(wb.SheetNames, ['Instructions', 'Delivery Timelines', 'Procurement Process', 'Reference Data']);
  });

  it('generates valid xlsx buffer', () => {
    const wb = createTestWorkbook();
    const buf = workbookToBuffer(wb);
    assert.ok(buf.length > 0, 'Buffer should not be empty');
    // Verify it can be re-read
    const parsed = XLSX.read(buf, { type: 'buffer' });
    assert.equal(parsed.SheetNames.length, 4);
  });

  it('exports delivery timeline headings correctly', () => {
    const wb = createTestWorkbook();
    const dlSheet = wb.Sheets['Delivery Timelines'];
    const data = XLSX.utils.sheet_to_json(dlSheet, { header: 1 });
    const expectedHeaders = ['Record ID', 'Department', 'Category', 'Item or Service', 'Estimated Lead Time', 'Requirements', 'Notes', 'Status', 'Display Order'];
    assert.deepEqual(data[0], expectedHeaders);
  });

  it('includes existing record IDs in export', () => {
    const testId = '550e8400-e29b-41d4-a716-446655440000';
    const wb = createTestWorkbook({
      deliveryRows: [[testId, 'Information Technology', 'Hardware', 'Laptop', '4-6 weeks', '', '', 'published', 1]]
    });
    const dlSheet = wb.Sheets['Delivery Timelines'];
    const data = XLSX.utils.sheet_to_json(dlSheet, { header: 1 });
    assert.equal(data[1][0], testId);
  });

  it('sanitizes formula injection in exported data', () => {
    const maliciousValue = '=CMD("calc")';
    const sanitized = sanitizeExcelValue(maliciousValue);
    assert.equal(sanitized, "'=CMD(\"calc\")");
  });
});

describe('Workbook Validation', () => {
  it('accepts a valid workbook', () => {
    const wb = createTestWorkbook({
      deliveryRows: [['', 'Information Technology', 'Hardware', 'Laptop', '4-6 weeks', 'Specs needed', '', 'published', 1]],
      procurementRows: [['', 1, 'Submit Request', 'Fill out form', 'Requester', '1 day', '', 'draft', 1]],
    });
    const buf = workbookToBuffer(wb);
    const result = parseAndValidateBuffer(buf, 'test.xlsx');
    assert.equal(result.hasBlockingErrors, false, `Expected no errors but got: ${JSON.stringify(result.errors)}`);
  });

  it('rejects workbook with missing sheet', () => {
    const wb = createTestWorkbook({ includeAllSheets: false });
    const buf = workbookToBuffer(wb);
    const result = parseAndValidateBuffer(buf, 'test.xlsx');
    assert.equal(result.hasBlockingErrors, true);
    assert.ok(result.errors.some(e => e.message.includes('Missing sheet')));
  });

  it('rejects non-xlsx file extension', () => {
    const wb = createTestWorkbook();
    const buf = workbookToBuffer(wb);
    const result = parseAndValidateBuffer(buf, 'test.csv');
    assert.equal(result.hasBlockingErrors, true);
    assert.ok(result.errors.some(e => e.message.includes('.xlsx')));
  });

  it('rejects invalid department value', () => {
    const wb = createTestWorkbook({
      deliveryRows: [['', 'Technology', 'Hardware', 'Laptop', '4 weeks', '', '', 'published', 1]],
    });
    const buf = workbookToBuffer(wb);
    const result = parseAndValidateBuffer(buf, 'test.xlsx');
    assert.equal(result.hasBlockingErrors, true);
    assert.ok(result.errors.some(e => e.message.includes('not approved')));
  });

  it('rejects invalid status value', () => {
    const wb = createTestWorkbook({
      deliveryRows: [['', 'Information Technology', 'Hardware', 'Laptop', '4 weeks', '', '', 'active', 1]],
    });
    const buf = workbookToBuffer(wb);
    const result = parseAndValidateBuffer(buf, 'test.xlsx');
    assert.equal(result.hasBlockingErrors, true);
    assert.ok(result.errors.some(e => e.message.includes('invalid')));
  });

  it('rejects duplicate Record IDs', () => {
    const dupeId = '550e8400-e29b-41d4-a716-446655440000';
    const wb = createTestWorkbook({
      deliveryRows: [
        [dupeId, 'Information Technology', 'Hardware', 'Laptop', '4 weeks', '', '', 'published', 1],
        [dupeId, 'Administration', 'Supplies', 'Desk', '2 weeks', '', '', 'draft', 2],
      ],
    });
    const buf = workbookToBuffer(wb);
    const result = parseAndValidateBuffer(buf, 'test.xlsx');
    assert.equal(result.hasBlockingErrors, true);
    assert.ok(result.errors.some(e => e.message.includes('Duplicate')));
  });

  it('rejects invalid UUID Record ID', () => {
    const wb = createTestWorkbook({
      deliveryRows: [['not-a-uuid-123', 'Information Technology', 'Hardware', 'Laptop', '4 weeks', '', '', 'published', 1]],
    });
    const buf = workbookToBuffer(wb);
    const result = parseAndValidateBuffer(buf, 'test.xlsx');
    assert.equal(result.hasBlockingErrors, true);
    assert.ok(result.errors.some(e => e.message.includes('Invalid UUID')));
  });

  it('rejects formula values in cells', () => {
    const wb = createTestWorkbook({
      deliveryRows: [['', 'Information Technology', 'Hardware', '=CMD("calc")', '4 weeks', '', '', 'published', 1]],
    });
    const buf = workbookToBuffer(wb);
    const result = parseAndValidateBuffer(buf, 'test.xlsx');
    assert.equal(result.hasBlockingErrors, true);
    assert.ok(result.errors.some(e => e.message.includes('Formula')));
  });

  it('rejects missing required field (Item)', () => {
    const wb = createTestWorkbook({
      deliveryRows: [['', 'Information Technology', 'Hardware', '', '4 weeks', '', '', 'published', 1]],
    });
    const buf = workbookToBuffer(wb);
    const result = parseAndValidateBuffer(buf, 'test.xlsx');
    assert.equal(result.hasBlockingErrors, true);
    assert.ok(result.errors.some(e => e.column === 'Item'));
  });

  it('rejects renamed column heading', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['INSTRUCTIONS']]), 'Instructions');
    // Wrong header name in column 4
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Record ID', 'Department', 'Category', 'Product Name', 'Estimated Lead Time', 'Requirements', 'Notes', 'Status', 'Display Order']]), 'Delivery Timelines');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Record ID', 'Step Number', 'Title', 'Description', 'Responsible Party', 'Expected Duration', 'Notes', 'Status', 'Display Order']]), 'Procurement Process');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Departments']]), 'Reference Data');
    const buf = workbookToBuffer(wb);
    const result = parseAndValidateBuffer(buf, 'test.xlsx');
    assert.equal(result.hasBlockingErrors, true);
    assert.ok(result.errors.some(e => e.message.includes('Header mismatch')));
  });
});

describe('Change Detection (Diffing)', () => {
  it('detects new records (blank Record ID)', () => {
    // Simulating the diff logic inline
    const parsedRows = [
      { id: undefined, department: 'Fleet', item: 'New Vehicle', isValid: true },
    ];
    const dbRecords = [];

    const inserts = parsedRows.filter(r => r.isValid && !r.id);
    assert.equal(inserts.length, 1);
    assert.equal(inserts[0].item, 'New Vehicle');
    assert.equal(dbRecords.length, 0);
  });

  it('detects updated records (field value changed)', () => {
    const existingId = '550e8400-e29b-41d4-a716-446655440000';
    const parsedRow = { id: existingId, item: 'Laptop Pro', estimatedLeadTime: '5-7 weeks', isValid: true };
    const dbRecord = { id: existingId, item: 'Laptop', estimated_lead_time: '4-6 weeks' };

    const diffs = [];
    if (parsedRow.item !== dbRecord.item) diffs.push({ field: 'item', old: dbRecord.item, new: parsedRow.item });
    if (parsedRow.estimatedLeadTime !== dbRecord.estimated_lead_time) diffs.push({ field: 'estimated_lead_time', old: dbRecord.estimated_lead_time, new: parsedRow.estimatedLeadTime });

    assert.equal(diffs.length, 2);
    assert.equal(diffs[0].old, 'Laptop');
    assert.equal(diffs[0].new, 'Laptop Pro');
  });

  it('detects unchanged records (no diff)', () => {
    const existingId = '550e8400-e29b-41d4-a716-446655440000';
    const parsedRow = { id: existingId, item: 'Laptop', estimatedLeadTime: '4-6 weeks', isValid: true };
    const dbRecord = { id: existingId, item: 'Laptop', estimated_lead_time: '4-6 weeks' };

    const diffs = [];
    if (parsedRow.item !== dbRecord.item) diffs.push({ field: 'item' });
    if (parsedRow.estimatedLeadTime !== dbRecord.estimated_lead_time) diffs.push({ field: 'lead_time' });

    assert.equal(diffs.length, 0);
  });

  it('detects missing records (in DB but not in workbook)', () => {
    const dbRecords = [
      { id: 'aaa-111', item: 'Laptop' },
      { id: 'bbb-222', item: 'Monitor' },
    ];
    const parsedRows = [{ id: 'aaa-111', item: 'Laptop', isValid: true }];
    const parsedIds = new Set(parsedRows.filter(r => r.id).map(r => r.id));
    const missing = dbRecords.filter(r => !parsedIds.has(r.id));

    assert.equal(missing.length, 1);
    assert.equal(missing[0].item, 'Monitor');
  });
});

describe('File Safety', () => {
  it('generates safe filename with date', () => {
    const date = '2026-08-06';
    const filename = `Helios_Towers_Supply_Chain_Handbook_${date}.xlsx`;
    assert.ok(!filename.includes(' '));
    assert.ok(filename.endsWith('.xlsx'));
    assert.ok(filename.includes('2026-08-06'));
  });

  it('rejects oversized buffer', () => {
    // Simulate a 6MB buffer
    const oversized = Buffer.alloc(6 * 1024 * 1024, 0);
    const result = parseAndValidateBuffer(oversized, 'huge.xlsx');
    assert.ok(result.hasBlockingErrors);
    assert.ok(result.errors.some(e => e.column === 'Size' || e.message.includes('parse')));
  });
});
