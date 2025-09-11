"use server";

import { getUserFromSession } from "@/lib/auth";
import { z } from "zod";
import { adminFirestore } from "@/firebase/firebase-admin";
import { employeeFormSchema } from "./validation";
import { nanoid } from "nanoid";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/notifications-service";
import { checkIfEmailIsAlreadyInUse, removeUsedInvite } from "../utils";

function generateSlug() {
    return [nanoid(), nanoid(), nanoid(), nanoid()].join('-');
}

export const createEmployee = async (formData: FormData) => {
    const session = await getUserFromSession();

    if (!session) {
        return {
            success: false,
            error: "User Not Authenticated",
        }
    }

    const slug = generateSlug();

    const emailInviteData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as string,
        pnumber: formData.get('pnumber') as string,
        cpf: formData.get('cpf') as string,
        address: formData.get('address') as string,
        used: false,
        slug: slug
    }

    const isEmailAlreadyInUse = await checkIfEmailIsAlreadyInUse(emailInviteData.email);

    if(isEmailAlreadyInUse){
        return { success: false, error: 'Email is already in use' }
    }

    // if the invite is used and the employee was already deleted, we should clean the invite also.

    const res = await removeUsedInvite(emailInviteData.email);

    if(!res.success){
        return { success: false, error: res.error }
    }

    try {
        await employeeFormSchema.parseAsync(emailInviteData);
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
        const emailInvitesCollection = adminFirestore.collection('emailInvites');
        await emailInvitesCollection.add({
            ...emailInviteData,
            createdAt: Date.now()
        });
    } catch (error) {
        return {
            success: false,
            error: "Error Creating Employee",
        }
    }

    const notification = {
        message: `Funcionário "${emailInviteData.name}" Foi Convidado.`,
        role: NotificationRole.MANAGER,
        createdBy: session.name,
        slug: slug,
        notificationSource: NotificationSource.EMAIL_INVITE
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