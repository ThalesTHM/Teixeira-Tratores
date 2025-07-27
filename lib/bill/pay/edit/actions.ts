"use server";

import { getUserFromSession } from "@/lib/auth";
import { billsToPayFormSchema } from "./validation";
import { z } from "zod";
import { adminFirestore } from "@/firebase/firebase-admin";

export const editBillToPay = async (slug: string, data: any) => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const billsCollection = adminFirestore.collection('billsToPay');
    const billSnapshot = await billsCollection
      .where('slug', '==', slug)
      .where('name', '==', data.name)
      .where('price', '==', data.price)
      .where('expireDate', '==', data.expireDate)
      .where('paymentMethod', '==', data.paymentMethod)
      .where('paymentStatus', '==', data.paymentStatus)
      .where('supplier', '==', data.supplier)
      .where('description', '==', data.description)
      .get();

    if (!billSnapshot.empty) {
      return { success: false, error: 'A bill with the same data already exists' };
    }
  } catch (error) {
    return { success: false, error: 'Error checking existing bill data' };
  }

  try {
    await billsToPayFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid bill data' };
    }
    return { success: false, error: 'Validation error' };
  }

  try {
    const billsCollection = adminFirestore.collection('billsToPay');
    const querySnapshot = await billsCollection.where('slug', '==', slug).limit(1).get();
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Bill not found' };
    }

    const bill = querySnapshot.docs[0];

    await bill.ref.update({
      name: data.name,
      price: data.price,
      expireDate: data.expireDate,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      supplier: data.supplier,
      description: data.description
    });

    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error editing the bill' };
  }
};
