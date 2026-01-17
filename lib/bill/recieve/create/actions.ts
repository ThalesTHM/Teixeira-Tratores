"use server";

import { SessionService } from "@/services/session/SessionService";
import { billsToRecieveFormSchema } from "./validation";
import { z } from "zod";
import { nanoid } from "nanoid";
import { ActionsHistoryRepository, BillsToReceiveRepository } from "@/database/repositories/Repositories";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const createBillToRecieve = async (formData: FormData) => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();

    if (!session) {
        await actionsHistoryRepository.create({
            action: 'Falha na Criação de Conta a Receber',
            details: `Tentativa de criar conta a receber sem autenticação.`,
            author: null,
            timestamp: new Date(),
            parameters: {
                authenticated: false
            }
        });

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

            await actionsHistoryRepository.create({
                action: 'Falha na Criação de Conta a Receber',
                details: `Falha na validação ao criar conta a receber "${billData.name}".`,
                author: session,
                timestamp: new Date(),
                parameters: {
                    ...billData,
                    validationErrors: fieldErrors
                }
            });

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
        await actionsHistoryRepository.create({
            action: 'Falha na Criação de Conta a Receber',
            details: `Erro ao criar conta a receber "${billData.name}". Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...billData,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            }
        });

        return {
            success: false,
            error:  "Error Creating Bill To Receive"
        }
    }
    
    await actionsHistoryRepository.create({
        action: 'Conta a Receber Criada',
        details: `Conta a receber "${billData.name}" foi criada.`,
        author: session,
        timestamp: new Date(),
        parameters: billData
    });

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

        await actionsHistoryRepository.create({
            action: 'Falha ao Criar Notificação',
            details: `Erro ao criar notificação para conta a receber "${billData.name}". Erro: ${notificationRes.error}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...billData,
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