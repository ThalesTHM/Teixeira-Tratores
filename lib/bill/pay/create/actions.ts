"use server";

import { getUserFromSession } from "@/lib/auth";
import { billsToPayFormSchema } from "./validation";
import { z } from "zod";
import { adminAuth, adminDB } from "@/firebase/firebase-admin";
import { push, ref, set } from "firebase/database";

export const createBillToPay = async (formData: FormData) => {
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
        supplier: formData.get('supplier'),
        description: formData.get('description')
    }

    try{
        await billsToPayFormSchema.parseAsync(billData);
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
        const billsToPayRef = adminDB.ref(`billsToPay`);
        const newBillsToPayRef = billsToPayRef.push();

        await newBillsToPayRef.set({
            name: billData.name,
            price: billData.price,
            expireDate: billData.expireDate,
            paymentMethod: billData.paymentMethod,
            paymentStatus: billData.paymentStatus,
            supplier: billData.supplier,
            description: billData.description,
            createdAt: Date.now()
        });
    } catch (error) {
        return {
            success: false,
            error:  "Error Creating Bill To Pay"
        }
    }

    return {
        success: true,
        error: ""
    }
}