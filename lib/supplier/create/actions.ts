"use server";

import { SessionService } from "@/services/session/SessionService";
import { supplierFormSchema } from "./validation";
import { z } from "zod";
import { SuppliersRepository } from "@/database/repositories/Repositories";
import { customAlphabet } from "nanoid";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

function generateSlug(name: string) {
    return [
        name?.toString().toLowerCase().replace(/\s+/g, "-") || "supplier",
        nanoid(),
        nanoid(),
        nanoid(),
        nanoid()
    ].join('-');
}

export const createSupplier = async (formData: FormData) => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();

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
    const slug = generateSlug(supplierData.name);

    try {
        const suppliersRepository = new SuppliersRepository();
        await suppliersRepository.create({
            name: supplierData.name,
            cnpj: supplierData.cnpj,
            address: supplierData.address,
            pnumber: supplierData.pnumber,
            description: supplierData.description,
            slug
        });
    } catch (error) {
        return {
            success: false,
            error:  "Error Creating Supplier",
        }
    }

    const notification = {
        message: `Fornecedor "${supplierData.name}" Foi Criado.`,
        role: NotificationRole.MANAGER,
        slug,
        createdBy: session.name,
        notificationSource: NotificationSource.SUPPLIER
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