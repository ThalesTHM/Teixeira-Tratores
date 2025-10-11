"use server";

import { getUserFromSession } from "@/lib/auth";
import { z } from "zod";
import { adminFirestore } from "@/firebase/firebase-admin";
import { employeeFormSchema } from "./validation";
import { nanoid } from "nanoid";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

function generateSlug() {
    // Example: abcd12-efg34-hijk56-lmnop7
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

    const employeeData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as string,
        pnumber: formData.get('pnumber') as string,
        cpf: formData.get('cpf') as string,
        address: formData.get('address') as string,
        used: false,
        slug: slug
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

    const notification = {
        message: `Funcionário "${employeeData.name}" Foi Convidado.`,
        role: NotificationRole.MANAGER,
        createdBy: session.name,
        slug: slug,
        notificationSource: NotificationSource.EMPLOYEE
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