"use server";

import { adminFirestore } from "@/firebase/firebase-admin";

export const viewBillsToReceive = async () => {
  try {
    const billsSnapshot = await adminFirestore.collection("billsToReceive").get();
    const bills = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, bills };
  } catch (error) {
    return { success: false, error: "Erro ao buscar contas a receber." };
  }
};

export const getBillToReceiveBySlug = async (slug: string) => {
  try {
    const doc = await adminFirestore.collection("billsToReceive").where("slug", "==", slug).limit(1).get();
    if (doc.empty) return { success: false, error: "Conta a receber não encontrada." };
    const docData = doc.docs[0];
    return { success: true, data: { id: docData.id, ...docData.data() } };
  } catch (error) {
    return { success: false, error: "Erro ao buscar conta a receber." };
  }
};
