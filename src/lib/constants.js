// Shared constants and enum values used across the app.

export const EXPENSE_CATEGORIES = [
  'Feed',
  'Supplements & Vitamins',
  'Medication',
  'Vaccines',
  'Veterinary Services',
  'Equipment',
  'Repairs & Maintenance',
  'Labor',
  'Transport',
  'Utilities (Electricity/Water)',
  'Water & Sanitation',
  'Litter & Bedding',
  'Packaging',
  'Cleaning & Biosecurity',
  'Rent',
  'Construction',
  'Staff Welfare',
  'Other',
  // Legacy categories retained for existing records
  'Medication / Vaccines',
  'Drinkers / Equipment',
  'Home Food',
  'Utilities / Electricity',
];

// Categories shown in the "record expense" dropdown (excludes legacy ones).
export const EXPENSE_CATEGORIES_FORM = [
  'Feed',
  'Supplements & Vitamins',
  'Medication',
  'Vaccines',
  'Veterinary Services',
  'Equipment',
  'Repairs & Maintenance',
  'Labor',
  'Transport',
  'Utilities (Electricity/Water)',
  'Water & Sanitation',
  'Litter & Bedding',
  'Packaging',
  'Cleaning & Biosecurity',
  'Rent',
  'Construction',
  'Staff Welfare',
  'Other',
];

export const EXPENSE_TAGS = [
  'Recurring',
  'One-time',
  'Urgent',
  'Operational',
  'Capital Asset',
  'Stock Purchase',
  'Health',
  'Biosecurity',
  'Maintenance',
  'Production',
  'Transport',
  'Staff',
];

export const SALES_TYPES = ['Eggs', 'Tray', 'Broken Eggs', 'Manure'];

// Optional tags for sales records — pick one or more per sale.
export const SALES_TAGS = [
  'Wholesale',
  'Retail',
  'Walk-in',
  'Contract',
  'Hotel / Restaurant',
  'Market Stall',
  'Prepaid',
  'Credit',
  'Cash',
  'Delivery',
  'Pickup',
  'Repeat Customer',
  'New Customer',
  'Discounted',
  'Bulk',
];

export const PAGE_SIZES = [10, 25, 50, 100];

export const EMPTY_DATA = { batches: [], sales: [], expenses: [] };

// Sentinel batchId meaning "this expense is split across every batch".
export const ALL_BATCHES = 'ALL';
export const ALL_BATCHES_LABEL = 'All Batches';
