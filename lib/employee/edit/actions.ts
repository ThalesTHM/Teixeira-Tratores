"use server";

import { adminAuth, adminFirestore } from "@/firebase/firebase-admin";
import { employeeFormSchema } from "./validation";
import { z } from "zod";
import { getUserFromSession } from "@/lib/auth";
import { getEmployeeBySlug } from "../view/actions";

const checkIfEmployeeIsEqual = (originalEmployee: any, data: any) => {
  return originalEmployee.name === data.name &&
         originalEmployee.email === data.email &&
         originalEmployee.role === data.role &&
         originalEmployee.pnumber === data.pnumber &&
         originalEmployee.cpf === data.cpf &&
         originalEmployee.address === data.address;
}

const checkEmailIsInUse = async (email: string) => {
  try {
    return await adminAuth.getUserByEmail(email);
  } catch (error) {
    return null;
  }
}

export const editEmployee = async (slug: string, data: any) => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: "User Not Authenticated" };
  }

  
  try {
    await employeeFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      return {
        success: false,
        error: fieldErrors
      };
    }
  }

  const originalEmployeeRes = await getEmployeeBySlug(slug);
  
  if (!originalEmployeeRes.success) {
    return { success: false, error: originalEmployeeRes.error };
  }

  const originalEmployee = originalEmployeeRes.employee;

  if (checkIfEmployeeIsEqual(originalEmployee, data)) {
    return { success: false, error: "An employee with the same data already exists." };
  }

  try {
    if(originalEmployee.email !== data.email){
      const emailInUse = await checkEmailIsInUse(data.email);
      if (emailInUse) {
        return { success: false, error: "Email already in use" };
      }
    }
  } catch (error) {
    return { success: false, error: "Error checking existing email" };
  }

  if(session.email !== data.email) {
    try {
      adminAuth.updateUser(session?.uid as string, {
        email: data.email,
      });
    } catch (error) {
      return { success: false, error: "Error Updating User Email" };
    }
  }

  try {
    const employeesCollection = adminFirestore.collection("users");
    const snapshot = await employeesCollection.where("slug", "==", slug).limit(1).get();
    
    if (snapshot.empty) {
      return { success: false, error: "Employee Not Found" };
    }
    
    const doc = snapshot.docs[0];
    
    await doc.ref.update({ 
      name: data.name,
      email: data.email,
      role: data.role,
      pnumber: data.pnumber,
      cpf: data.cpf,
      address: data.address,
      updatedAt: Date.now(),
      updatedBy: session.name
   });
  } catch (error) {
    if(error instanceof Error){
      console.error("Error updating employee: ", error);
      console.log("session: ", session);
      return { success: false, error: error.message };
    }

    return { success: false, error: "Error Editing Employee" };
  }

  return { success: true, error: ""};
};
