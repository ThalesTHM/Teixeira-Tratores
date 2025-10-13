"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";

type Supplier = {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  pnumber: string;
  description: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: number;
};

export const viewSuppliers = async (): Promise<{ success: boolean; error: string; suppliers: Supplier[] }> => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: 'User not authenticated', suppliers: [] };
  }

  try {
    const suppliersSnapshot = await adminFirestore.collection('suppliers').get();
    const suppliers: Supplier[] = suppliersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? '',
        cnpj: data.cnpj ?? '',
        address: data.address ?? '',
        pnumber: data.pnumber ?? '',
        description: data.description ?? '',
        slug: data.slug ?? '',
        ...data,
      };
    });
    return {
      success: true,
      suppliers,
      error: ""
    };
  } catch (error) {
    return {
      success: false,
      suppliers: [],
      error: "Error fetching suppliers"
    };
  }
};

export const getSupplierBySlug = async (slug: string) => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: 'User not authenticated', supplier: null };
  }

  try {
    const suppliersCollection = adminFirestore.collection('suppliers');
    const snapshot = await suppliersCollection.where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) {
      return { success: false, error: 'Supplier not found.', supplier: null };
    }
    return { success: true, error: '', supplier: snapshot.docs[0].data() };
  } catch (error) {
    return { success: false, error: 'Error fetching supplier.', supplier: null };
  }
};

export const getSupplierById = async (supplierId: string) => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const supplierDoc = await adminFirestore.collection('suppliers').doc(supplierId).get();
    if (!supplierDoc.exists) {
      return { success: false, error: 'Supplier not found' };
    }
    return { success: true, supplier: supplierDoc.data(), error: '' };
  } catch (error) {
    return { success: false, error: 'Error fetching supplier' };
  }
};