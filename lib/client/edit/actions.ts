"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";
import { clientFormSchema } from "./validation";
import { z } from "zod";

export const editClient = async (slug: string, data: any) => {
  const session = await getUserFromSession();
  
  if (!session) {
    return { success: false, error: 'User not authenticated.' };
  }
  // Validate with zod
  try {
    await clientFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid client data.' };
    }

    return { success: false, error: 'Validation error.' };
  }
  try {
    const clientsCollection = adminFirestore.collection('clients');

    const duplicateSnapshot = await clientsCollection
      .where('name', '==', data.name)
      .where('cpf', '==', data.cpf)
      .where('address', '==', data.address)
      .where('pnumber', '==', data.pnumber)
      .get();

    if (duplicateSnapshot.docs.length > 0) {
      return { success: false, error: 'A client with the same data already exists.' };
    }

    const querySnapshot = await clientsCollection.where('slug', '==', slug).limit(1).get();

    if (querySnapshot.empty) {
      return { success: false, error: 'Client not found.' };
    }

    const doc = querySnapshot.docs[0];

    await doc.ref.update({
      name: data.name,
      cpf: data.cpf,
      address: data.address,
      pnumber: data.pnumber
    });

    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error editing the client.' };
  }
};
