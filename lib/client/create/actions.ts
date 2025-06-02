"use server";

import { getUserFromSession } from "@/lib/auth";
import { clientFormSchema } from "./validation";
import { z } from "zod";
import { adminAuth, adminDB } from "@/firebase/firebase-admin";
import { push, ref, set } from "firebase/database";

export const createClient = async (formData: FormData) => {
    const session = await getUserFromSession();

    if (!session) {
        return {
            success: false,
            error: "User Not Authenticated",
        }
    }

    const clientData = {
        name: formData.get('name') as string,
        cpf: formData.get('cpf') as string,
        address: formData.get('address') as string,
        pnumber: formData.get('pnumber') as string
    }

    try{
        await clientFormSchema.parseAsync(clientData);
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
        const clientsRef = adminDB.ref(`clients`);
        const newClientRef = clientsRef.push();

        await newClientRef.set({
            name: clientData.name,
            cpf: clientData.cpf,
            address: clientData.address,
            pnumber: clientData.pnumber,
            createdAt: Date.now(),
        });
    } catch (error) {
        return {
            success: false,
            error:  "Error Creating Client"
        }
    }

    return {
        success: true,
        error: ""
    }
}