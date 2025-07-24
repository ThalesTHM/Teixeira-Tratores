"use server";

import { adminFirestore } from "@/firebase/firebase-admin";

export const removeEmployee = async (slug: string) => {
  try {
    const employeesCollection = adminFirestore.collection("employees");
    const snapshot = await employeesCollection.where("slug", "==", slug).limit(1).get();
    if (snapshot.empty) {
      return { success: false, error: "Funcionário Não Encontrado" };
    }
    const doc = snapshot.docs[0];
    await doc.ref.delete();
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro Ao Excluir Funcionário" };
  }
};
