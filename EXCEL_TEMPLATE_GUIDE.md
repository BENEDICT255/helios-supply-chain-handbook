# Helios Towers Supply Chain Handbook — Excel Template Technical Specification

This document provides complete technical specifications for the bulk Excel maintenance workbook (`Helios_Towers_Supply_Chain_Handbook.xlsx`) used by the Helios Towers Supply Chain Handbook.

---

## 1. Workbook Structure & Required Worksheets

The workbook must contain four worksheets in exact order:

| Sheet Name | Required? | Purpose |
|------------|-----------|---------|
| `Instructions` | Yes | Usage guidelines, metadata timestamp, version notice |
| `Delivery Timelines` | Yes | Indicative lead times for goods & services |
| `Procurement Process` | Yes | Sequential steps of the procurement workflow |
| `Reference Data` | Yes | Approved reference lists (Departments, Statuses) |

---

## 2. Delivery Timelines Sheet Specifications

### Column Schema
| Column | Visible Header | Database Field | Type | Required? | Constraints & Limits |
|--------|----------------|----------------|------|-----------|----------------------|
| A | `Record ID` | `id` | UUID / Text | Conditional | Immutable for existing rows. Leave BLANK for new rows. Must be valid UUID format. |
| B | `Department` | `department` | Text | Yes | Max 100 chars. Must match approved department list exactly. |
| C | `Category` | `category` | Text | Yes | Max 150 chars. E.g. `Computers and Accessories`, `Power Systems`. |
| D | `Item or Service` | `item` | Text | Yes | Max 200 chars. E.g. `Laptop`, `Generator`. |
| E | `Estimated Lead Time` | `estimated_lead_time` | Text | Yes | Max 100 chars. E.g. `4–6 weeks`, `3–10 working days`. |
| F | `Requirements` | `requirements` | Text | No | Max 2,000 chars. Prerequisites before sourcing. |
| G | `Notes` | `notes` | Text | No | Max 2,000 chars. Stock availability or delivery caveats. |
| H | `Status` | `status` | Text | Yes | Must be `published` or `draft`. Case-insensitive. |
| I | `Display Order` | `display_order` | Integer | Yes | Positive whole number (0, 1, 2, ...). |

### Approved Department Values
- `Information Technology`
- `Administration`
- `Network Operations`
- `Fleet`
- `Health, Safety and Environment`
- `Professional Services`

---

## 3. Procurement Process Sheet Specifications

### Column Schema
| Column | Visible Header | Database Field | Type | Required? | Constraints & Limits |
|--------|----------------|----------------|------|-----------|----------------------|
| A | `Record ID` | `id` | UUID / Text | Conditional | Immutable for existing rows. Leave BLANK for new rows. |
| B | `Step Number` | `step_number` | Integer | Yes | Whole number ≥ 1. Defines sequence number. |
| C | `Title` | `title` | Text | Yes | Max 200 chars. Step title. |
| D | `Description` | `description` | Text | Yes | Max 3,000 chars. Step procedure details. |
| E | `Responsible Party` | `responsible_party` | Text | No | Max 200 chars. E.g. `Requester`, `Supply Chain`. |
| F | `Expected Duration` | `expected_duration` | Text | No | Max 100 chars. E.g. `1–3 working days`. |
| G | `Notes` | `notes` | Text | No | Max 2,000 chars. Additional procedure notes. |
| H | `Status` | `status` | Text | Yes | Must be `published` or `draft`. |
| I | `Display Order` | `display_order` | Integer | Yes | Positive whole number (0, 1, 2, ...). |

---

## 4. Server-Side Validation Rules Summary

Every uploaded workbook undergoes 28 strict automated checks on the server:

1. **File Extension**: Must end with `.xlsx`.
2. **File Size**: Maximum 5 MB (5,242,880 bytes).
3. **Workbook Readability**: File must be valid non-corrupted ZIP/XLSX structure.
4. **Sheet Presence**: All 4 required sheets must exist.
5. **Column Header Matching**: Column headers in Row 1 must match expected text exactly.
6. **Formula Injection Prevention**: Cells containing formulas starting with `=`, `+`, `-`, `@` are strictly blocked.
7. **Record ID Format**: Any non-empty Record ID must be a valid 36-character UUID.
8. **Record ID Uniqueness**: No duplicate Record IDs within the same sheet.
9. **Row Limits**: Max 5,000 rows for Delivery Timelines, max 500 rows for Procurement Process.
10. **Controlled Department Validation**: Department text must match approved list.
11. **Controlled Status Validation**: Status text must be `published` or `draft`.
12. **Numeric Type Coercion**: Step Number and Display Order must be integers.

---

## 5. Troubleshooting Common Upload Errors

| Error Message | Cause | Resolution |
|---------------|-------|------------|
| `Missing required worksheet: "Delivery Timelines"` | Sheet renamed or deleted | Restore sheet name to `Delivery Timelines` exactly. |
| `Column heading mismatch at position 2...` | Header modified or moved | Do not change header text in Row 1. |
| `Formula values (starting with =, +, -, @) are strictly prohibited` | Cell contains Excel formula | Replace formula with plain text value. Prefix text with single quote `'` if necessary. |
| `"Technology" is not an approved department` | Department spelling mismatch | Use exact department name from Reference Data sheet. |
| `Invalid Record ID format "123"` | Manually typed invalid ID | Leave Record ID blank for new rows, or do not edit existing IDs. |
