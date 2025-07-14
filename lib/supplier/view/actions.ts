"use server";

import { adminFirestore } from "@/firebase/firebase-admin";

export const viewSuppliers = async () => {
  try {
    const suppliersSnapshot = await adminFirestore.collection('suppliers').get();
    const suppliers = suppliersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  try {
    const suppliersCollection = adminFirestore.collection('suppliers');
    const snapshot = await suppliersCollection.where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) {
      return { success: false, error: 'Fornecedor não encontrado.', supplier: null };
    }
    return { success: true, error: '', supplier: snapshot.docs[0].data() };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar fornecedor.', supplier: null };
  }
};
