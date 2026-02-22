import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(word: string) {
  if (!word) return word;
  return word[0].toUpperCase() + word.substr(1).toLowerCase();
}

export function generatePasswordRecoveryCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
 
  let code = '';
 
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return code;
}

/**
 * Converts Firestore Timestamp objects to ISO strings for serialization
 * This is necessary when passing data from Server Components to Client Components
 */
export function serializeFirestoreData<T = any>(data: any): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item)) as T;
  }
  
  // Check if it's a Firestore Timestamp object first (before iterating)
  if ('_seconds' in data && '_nanoseconds' in data) {
    const seconds = typeof data._seconds === 'number' ? data._seconds : 0;
    const nanoseconds = typeof data._nanoseconds === 'number' ? data._nanoseconds : 0;
    const timestamp = new Date(seconds * 1000 + nanoseconds / 1000000);
    return timestamp.toISOString() as T;
  }
  
  // Check if it has a toDate method (Firestore Timestamp)
  if (typeof (data as any).toDate === 'function') {
    return (data as any).toDate().toISOString() as T;
  }
  
  // Check if it's a Date object
  if (data instanceof Date) {
    return data.toISOString() as T;
  }
  
  const serialized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      serialized[key] = value;
    } else if (typeof value === 'object') {
      // Recursively serialize (this will handle nested timestamps, dates, arrays, and objects)
      serialized[key] = serializeFirestoreData(value);
    } else {
      serialized[key] = value;
    }
  }
  
  return serialized as T;
}