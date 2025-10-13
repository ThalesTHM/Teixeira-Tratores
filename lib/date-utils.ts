// Utility functions for handling dates across the application

export function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // If it's a Firestore Timestamp
  if (typeof dateValue === 'object' && dateValue.toDate) {
    return dateValue.toDate();
  }
  
  // If it's a string or number, try to convert
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(dateValue: any): string {
  const date = parseDate(dateValue);
  return date ? date.toLocaleString() : "-";
}

export function formatDateOnly(dateValue: any): string {
  const date = parseDate(dateValue);
  return date ? date.toLocaleDateString() : "-";
}