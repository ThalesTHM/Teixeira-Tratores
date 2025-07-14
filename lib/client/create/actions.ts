"use server";

import { getUserFromSession } from "@/lib/auth";
import { clientFormSchema } from "./validation";
import { z } from "zod";
import { adminFirestore } from "@/firebase/firebase-admin";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

function generateSlug() {
    // Example: abcd12-efg34-hijk56-lmnop7
    return [nanoid(), nanoid(), nanoid(), nanoid()].join('-');
}

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

    try {
        const clientsCollection = adminFirestore.collection('clients');
        await clientsCollection.add({
            name: clientData.name,
            cpf: clientData.cpf,
            address: clientData.address,
            pnumber: clientData.pnumber,
            slug: generateSlug(),
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