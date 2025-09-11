"use server";

import { adminFirestore } from "@/firebase/firebase-admin";

export interface EmailInvite {
  address: string;
  cpf: string;
  createdAt: number;
  email: string;
  name: string;
  pnumber: string;
  role: string;
  slug: string;
  used: boolean;
  updatedAt: number;
}

export async function viewEmployees(): Promise<{
  success: true; emailInvites: EmailInvite[];
} | {
  success: false; error: string;
}> {
  try {
    const snapshot = await adminFirestore.collection("emailInvites").get();
    const emailInvites: EmailInvite[] = snapshot.docs.map(doc => ({
      ...(doc.data() as EmailInvite),
    }));
    return { success: true, emailInvites };
  } catch (error) {
    return { success: false, error: "Error finding email invite" };
  }
}

export async function getEmailInviteBySlug(slug: string): Promise<{
  success: true; emailInvite: EmailInvite, error: string;
} | {
  success: false; error: string;
}> {
  try {
    const snapshot = await adminFirestore
      .collection("emailInvites")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: "Email invite not found" };
    }

    const doc = snapshot.docs[0];
    const emailInvite: EmailInvite = {
      ...doc.data() as EmailInvite,
    };

    return { success: true, emailInvite, error: "" };
  } catch (error) {
    return { success: false, error: "Error finding email invite" };
  }
}