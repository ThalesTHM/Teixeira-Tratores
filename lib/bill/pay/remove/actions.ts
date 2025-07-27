"use server";

import { getUserFromSession } from '@/lib/auth';
import { adminFirestore } from '@/firebase/firebase-admin';

export const removeBillToPay = async (slug: string) => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const billsCollection = adminFirestore.collection('billsToPay');
    const billSnapshot = await billsCollection.where('slug', '==', slug).limit(1).get();

    if (billSnapshot.empty) {
      return { success: false, error: 'Bill not found' };
    }

    const billDoc = billSnapshot.docs[0];
    await billDoc.ref.delete();

    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error removing the bill' };
  }
};