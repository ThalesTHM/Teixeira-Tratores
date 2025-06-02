"use server";

import { getUserFromSession } from "@/lib/auth";
import { billsToRecieveFormSchema } from "./validation";
import { z } from "zod";
import { adminAuth, adminDB } from "@/firebase/firebase-admin";
import { push, ref, set } from "firebase/database";

export const createBillToRecieve = async (formData: FormData) => {
    const session = await getUserFromSession();

    if (!session) {
        return {
            success: false,
            error: "User Not Authenticated",
        }
    }

    const billData = {
        price: Number(formData.get('price')),
        expireDate: (new Date(formData.get('expireDate') as string)).getTime(),
        paymentMethod: formData.get('paymentMethod'),
        paymentStatus: formData.get('paymentStatus'),
        description: formData.get('description'),
        project: formData.get('project')
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

    const uid = session.uid;

    try {
        const billsToRecieveRef = adminDB.ref(`billsToRecieve`);
        const newBillsToRecieveRef = billsToRecieveRef.push();

        await newBillsToRecieveRef.set({
            project: formData.get('project'),
            price: billData.price,
            expireDate: billData.expireDate,
            paymentMethod: billData.paymentMethod,
            paymentStatus: billData.paymentStatus,
            description: billData.description,
            createdAt: Date.now()
        });
    } catch (error) {
        return {
            success: false,
            error:  "Error Creating Bill To Recieve"
        }
    }

    return {
        success: true,
        error: ""
    }
}