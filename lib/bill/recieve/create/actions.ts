"use server";

import { SessionService } from "@/services/session/SessionService";
import { billsToRecieveFormSchema } from "./validation";
import { z } from "zod";
import { nanoid } from "nanoid";
import { BillsToReceiveRepository } from "@/database/repositories/Repositories";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

export const createBillToRecieve = async (formData: FormData) => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();

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
        description: formData.get('description'),
        project: formData.get('project'),
        slug: slug,
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
        const billsToReceiveRepository = new BillsToReceiveRepository();
        await billsToReceiveRepository.create(billData);
    } catch (error) {
        return {
            success: false,
            error:  "Error Creating Bill To Receive"
        }
    }
    
    const notification = {
        message: `Conta a Receber "${billData.name}" Foi Criada.`,
        role: NotificationRole.MANAGER,
        slug: slug,
        createdBy: session.name,
        notificationSource: NotificationSource.BILL_TO_RECEIVE
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