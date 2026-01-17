"use server";

import { SessionService } from "@/services/session/SessionService";
import { clientFormSchema } from "./validation";
import { z } from "zod";
import { ActionsHistoryRepository, ClientsRepository } from "@/database/repositories/Repositories";
import { customAlphabet } from "nanoid";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);
const actionsHistoryRepository = new ActionsHistoryRepository();

function generateSlug() {
    // Example: abcd12-efg34-hijk56-lmnop7
    return [nanoid(), nanoid(), nanoid(), nanoid()].join('-');
}

export const createClient = async (formData: FormData) => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();

    if (!session) {
        await actionsHistoryRepository.create({
            action: 'Falha na Criação de Cliente',
            details: `Tentativa de criar cliente sem autenticação.`,
            author: null,
            timestamp: new Date(),
            parameters: {
                formData: Object.fromEntries(formData),
                authenticated: false
            }
        });

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

            await actionsHistoryRepository.create({
                action: 'Falha na Criação de Cliente',
                details: `Falha na validação ao criar cliente "${clientData.name}".`,
                author: session,
                timestamp: new Date(),
                parameters: {
                    ...clientData,
                    validationErrors: fieldErrors
                }
            });

            return {
                success: false,
                error: fieldErrors
            }
        }
    }

    const slug = generateSlug();

    try {
        const clientsRepository = new ClientsRepository();
        await clientsRepository.create({
            name: clientData.name,
            cpf: clientData.cpf,
            address: clientData.address,
            pnumber: clientData.pnumber,
            slug: slug,
        });

        await actionsHistoryRepository.create({
            action: 'Cliente Criado',
            details: `Cliente "${clientData.name}" foi criado.`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...clientData,
                slug
            }
        });
    } catch (error) {
        await actionsHistoryRepository.create({
            action: 'Falha na Criação de Cliente',
            details: `Erro ao criar cliente "${clientData.name}". Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...clientData,
                slug,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            }
        });

        return {
            success: false,
            error:  "Error Creating Client"
        }
    }

    const notification = {
        message: `Cliente "${clientData.name}" Foi Criado.`,
        role: NotificationRole.MANAGER,
        createdBy: session.name,
        slug: slug,
        notificationSource: NotificationSource.CLIENT
    }
    
    const notificationRes = await NotificationsService.createNotification(notification);

    if (!notificationRes.success) {
        console.error("Error creating notification:", notificationRes.error);

        await actionsHistoryRepository.create({
            action: 'Falha ao Criar Notificação',
            details: `Erro ao criar notificação para cliente "${clientData.name}". Erro: ${notificationRes.error}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...clientData,
                slug,
                error: notificationRes.error
            }
        });

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