"use server";

import { getUserFromSession } from '@/lib/auth';
import { adminFirestore } from '@/firebase/firebase-admin';

export const getBillsToPayBySlug = async (slug: string) => {
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

    const billData = billSnapshot.docs[0].data();
    return { success: true, data: billData, error: '' };
  } catch (error) {
    return { success: false, error: 'Error retrieving the bill' };
  }
};

export const viewBillsToPay = async () => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const billsCollection = adminFirestore.collection('billsToPay');
    const snapshot = await billsCollection.get();

    if (snapshot.empty) {
      return { success: true, data: null, error: '' };
    }

    const billsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: billsData, error: '' };
  } catch (error) {
    return { success: false, error: 'Error retrieving bills' };
  }
};