"use server";

import { getUserFromSession } from "@/lib/auth";
import { supplierFormSchema } from "./validation";
import { z } from "zod";
import { adminAuth, adminFirestore } from "@/firebase/firebase-admin";

export const createSupplier = async (formData: FormData) => {
    const session = await getUserFromSession();

    if (!session) {
        return {
            success: false,
            error: "User Not Authenticated",
        }
    }

    const supplierData = {
        name: formData.get('name') as string,
        cnpj: formData.get('cnpj') as string,
        address: formData.get('address') as string,
        pnumber: formData.get('pnumber') as string,
        description: formData.get('description') as string
    }

    try{
        await supplierFormSchema.parseAsync(supplierData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const fieldErrors = error.flatten().fieldErrors;

            return {
                success: false,
                error: fieldErrors
            }
        }
    }

    const uid = session.uid;

    try {
        const suppliersCollection = adminFirestore.collection('suppliers');
        await suppliersCollection.add({
            name: supplierData.name,
            cnpj: supplierData.cnpj,
            address: supplierData.address,
            pnumber: supplierData.pnumber,
            description: supplierData.description,
            createdAt: Date.now()
        });
    } catch (error) {
        return {
            success: false,
            error:  "Error Creating Supplier",
        }
    }

    return {
        success: true,
        error: ""
    }
}