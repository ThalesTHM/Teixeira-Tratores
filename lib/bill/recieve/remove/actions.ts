"use server";

import { adminFirestore } from "@/firebase/firebase-admin";

export const removeBillToReceive = async (slug: string) => {
  try {
    await adminFirestore.collection("billsToReceive").doc(slug).delete();
  } catch (error) {
    return {
      success: false,
      error: "Erro ao excluir conta a receber.",
    };
  }
  return {
    success: true,
    error: ""
  };
}
