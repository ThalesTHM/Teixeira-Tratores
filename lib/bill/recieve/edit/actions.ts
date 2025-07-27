"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { billsToRecieveFormSchema } from "./validation";
import { z } from "zod";

export const editBillToReceive = async (slug: string, formData: any) => {
  try {
    await billsToRecieveFormSchema.parseAsync(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
          return {
            success: false,
            error: Object.values(fieldErrors).flat().join("; ") || "Validation error."
      };
    }
        return {
          success: false,
          error: "Validation error."
    };
  }

  try {
    const billDoc = await adminFirestore.collection("billsToReceive")
    .where("slug", "==", slug)
    .where("name", "==", formData.name)
    .where("price", "==", formData.price)
    .where("expireDate", "==", formData.expireDate)
    .where("paymentMethod", "==", formData.paymentMethod)
    .where("paymentStatus", "==", formData.paymentStatus)
    .where("description", "==", formData.description)
    .where("project", "==", formData.project)
    .get();

  if (!billDoc.empty) {
          return {
            success: false,
            error: "No changes detected."
    };
  }
  } catch (error) {
        return {
          success: false,
          error: "Error fetching bill to receive."
    }; 
  }
  
  try {
    const billCollection = adminFirestore.collection("billsToReceive");
    const snapshot = await billCollection.where("slug", "==", slug).limit(1).get();
    console.log(slug);
    
    if (snapshot.empty) {
      return { success: false, error: 'Bill not found.' };
    }
    const billDoc = snapshot.docs[0].ref;
    
    billDoc.update({
      ...formData,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error editing bill to receive:", error.message);
    }
    return {
      success: false,
      error: "Error editing bill to receive.",
    };
  }
  return {
    success: true,
    error: ""
  };
}
