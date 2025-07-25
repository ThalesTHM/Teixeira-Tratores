"use server";

import { adminAuth, adminFirestore } from "@/firebase/firebase-admin";

export const removeEmployee = async (slug: string) => {
  let employeesCollection;
  let snapshot;
  let doc;
  
  try {
    employeesCollection = adminFirestore.collection("users");
    snapshot = await employeesCollection.where("slug", "==", slug).limit(1).get();
    doc = snapshot.docs[0]
    
    if (snapshot.empty) {
      return { success: false, error: "Employee Not Found" };
    }
  } catch (error) {
    return { success: false, error: "Error Fetching Employee" };
  }
  
  try {
    const email = doc.data().email;
    const user = await adminAuth.getUserByEmail(email);
    if (user) {
      await adminAuth.deleteUser(user.uid);
    }
  } catch (error) {
    return { success: false, error: "Error Deleting Employee Authentication" };
  }

  try {
    await doc.ref.delete();
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error Deleting Employee Document" };
  }
};
