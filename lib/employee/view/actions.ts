"use server";

import { adminFirestore } from "@/firebase/firebase-admin";

export interface Employee {
  id: string,
  address: string;
  cpf: string;
  createdAt: number;
  email: string;
  name: string;
  pnumber: string;
  role: string;
  slug: string;
  updatedAt: number;
}

export async function viewEmployees(): Promise<{
  success: true; employees: Employee[];
} | {
  success: false; error: string;
}> {
  try {
    const snapshot = await adminFirestore.collection("users").get();
    const employees: Employee[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Employee, "id">),
    }));
    return { success: true, employees };
  } catch (error) {
    return { success: false, error: "Erro Ao Buscar Funcionários" };
  }
}

export async function getEmployeeBySlug(slug: string): Promise<{
  success: true; employee: Employee, error: string;
} | {
  success: false; error: string;
}> {
  try {
    const snapshot = await adminFirestore
      .collection("users")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: "Funcionário Não Encontrado" };
    }

    const doc = snapshot.docs[0];
    const employee: Employee = {
      id: doc.id,
      ...(doc.data() as Omit<Employee, "id">),
    };

    return { success: true, employee, error: "" };
  } catch (error) {
    return { success: false, error: "Erro Ao Buscar Funcionário" };
  }
}