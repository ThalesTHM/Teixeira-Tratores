"use server";

import { getUserFromSession } from "@/lib/auth";
import { z } from "zod";
import { adminFirestore } from "@/firebase/firebase-admin";
import { employeeFormSchema } from "./validation";

export const createEmployee = async (formData: FormData) => {
    const session = await getUserFromSession();

    if (!session) {
        return {
            success: false,
            error: "User Not Authenticated",
        }
    }

    const employeeData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        position: formData.get('position') as string,
        pnumber: formData.get('pnumber') as string,
        cpf: formData.get('cpf') as string,
        address: formData.get('address') as string,
        used: false
    }

    try {
        await employeeFormSchema.parseAsync(employeeData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const fieldErrors = error.flatten().fieldErrors;

            return {
                success: false,
                error: fieldErrors
            }
        }
    }

    try {
        const employeesCollection = adminFirestore.collection('emailInvites');
        await employeesCollection.add({
            ...employeeData,
            createdAt: Date.now()
        });
    } catch (error) {
        return {
            success: false,
            error: "Error Creating Employee",
        }
    }

    return {
        success: true,
        error: ""
    }
}