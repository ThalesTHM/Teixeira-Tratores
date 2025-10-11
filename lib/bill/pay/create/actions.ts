"use server";

import { getUserFromSession } from "@/lib/auth";
import { billsToPayFormSchema } from "./validation";
import { z } from "zod";
import { adminFirestore } from "@/firebase/firebase-admin";
import { nanoid } from "nanoid";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

export const createBillToPay = async (formData: FormData) => {
    const session = await getUserFromSession();

    if (!session) {
        return {
            success: false,
            error: "User Not Authenticated",
        }
    }

    const slug = [nanoid(10), nanoid(10), nanoid(10), nanoid(10), nanoid(10)].join('-');
    
    const billData = {
        name: formData.get('name'),
        price: Number(formData.get('price')),
        expireDate: (new Date(formData.get('expireDate') as string)).getTime(),
        paymentMethod: formData.get('paymentMethod'),
        paymentStatus: formData.get('paymentStatus'),
        supplier: formData.get('supplier'),
        description: formData.get('description'),
        slug,
        createdAt: Date.now()
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

    try {
        const billsCollection = adminFirestore.collection('billsToPay');
        await billsCollection.add(billData);
    } catch (error) {
        return {
            success: false,
            error:  "Error Creating Bill To Pay"
        }
    }

    const notification = {
        message: `Conta a Pagar "${billData.name}" Foi Criada.`,
        role: NotificationRole.MANAGER,
        slug: slug,
        createdBy: session.name,
        notificationSource: NotificationSource.BILL_TO_PAY
    }
    
    const notificationRes = await NotificationsService.createNotification(notification);

    if (!notificationRes.success) {
        console.error("Error creating notification:", notificationRes.error);
        return {
            success: false,
            error: "Error creating notification"
        };
    }

    return {
        success: true,
        error: ""
    }
}