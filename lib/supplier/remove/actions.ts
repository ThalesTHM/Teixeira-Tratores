"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";

export const removeSupplier = async (slug: string) => {
  const session = await getUserFromSession();
  if (!session) {
    return { success: false, error: 'User not authenticated.' };
  }
  try {
    const suppliersCollection = adminFirestore.collection('suppliers');
    const querySnapshot = await suppliersCollection.where('slug', '==', slug).limit(1).get();
    if (querySnapshot.empty) {
      return { success: false, error: 'Supplier not found.' };
    }
    const doc = querySnapshot.docs[0];
    await doc.ref.delete();
    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error excluding the supplier.' };
  }
};
