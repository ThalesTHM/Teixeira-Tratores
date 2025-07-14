"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";
import { clientFormSchema } from "@/lib/validation";
import { z } from "zod";

export const removeClient = async (slug: string) => {
  const session = await getUserFromSession();
  if (!session) {
    return { success: false, error: 'User not authenticated.' };
  }
  try {
    const clientsCollection = adminFirestore.collection('clients');
    const querySnapshot = await clientsCollection.where('slug', '==', slug).limit(1).get();
    if (querySnapshot.empty) {
      return { success: false, error: 'Client not found.' };
    }
    const doc = querySnapshot.docs[0];
    await doc.ref.delete();
    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error excluding the client.' };
  }
};
