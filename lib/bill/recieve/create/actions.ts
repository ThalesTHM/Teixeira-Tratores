"use server";

import { getUserFromSession } from "@/lib/auth";
import { billsToRecieveFormSchema } from "./validation";
import { z } from "zod";
import { nanoid } from "nanoid";
import { adminFirestore } from "@/firebase/firebase-admin";

export const createBillToRecieve = async (formData: FormData) => {
    const session = await getUserFromSession();

    if (!session) {
        return {
            success: false,
            error: "User Not Authenticated",
        }
    }

    const billData = {
        name: formData.get('name'),
        price: Number(formData.get('price')),
        expireDate: (new Date(formData.get('expireDate') as string)).getTime(),
        paymentMethod: formData.get('paymentMethod'),
        paymentStatus: formData.get('paymentStatus'),
        description: formData.get('description'),
        project: formData.get('project'),
        slug: `${nanoid(10)}-${nanoid(10)}-${nanoid(10)}-${nanoid(10)}-${nanoid(10)}`
    }

    try{
        await billsToRecieveFormSchema.parseAsync(billData);
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
        const billsCollection = adminFirestore.collection('billsToReceive');
        await billsCollection.add({
            ...billData,
            createdAt: Date.now()
        });
    } catch (error) {
        return {
            success: false,
            error:  "Error Creating Bill To Receive"
        }
    }

    return {
        success: true,
        error: ""
    }
}