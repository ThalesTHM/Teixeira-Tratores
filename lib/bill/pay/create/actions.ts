"use server";

import { SessionService } from "@/services/session/SessionService";
import { billsToPayFormSchema } from "./validation";
import { z } from "zod";
import { ActionsHistoryRepository, BillsToPayRepository } from "@/database/repositories/Repositories";
import { nanoid } from "nanoid";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const createBillToPay = async (formData: FormData) => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();

    if (!session) {
        await actionsHistoryRepository.create({
            action: 'Falha na Criação de Conta a Pagar',
            details: `Tentativa de criar conta a pagar sem autenticação.`,
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
        supplier: formData.get('supplier'),
        description: formData.get('description'),
        slug,
    }

    try{
        await billsToPayFormSchema.parseAsync(billData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const fieldErrors = error.flatten().fieldErrors;

            await actionsHistoryRepository.create({
                action: 'Falha na Criação de Conta a Pagar',
                details: `Falha na validação ao criar conta a pagar "${billData.name}".`,
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
        const billsToPayRepository = new BillsToPayRepository();
        await billsToPayRepository.create(billData);
    } catch (error) {
        await actionsHistoryRepository.create({
            action: 'Falha na Criação de Conta a Pagar',
            details: `Erro ao criar conta a pagar "${billData.name}". Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...billData,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            }
        });

        return {
            success: false,
            error:  "Error Creating Bill To Pay"
        }
    }

    await actionsHistoryRepository.create({
        action: 'Conta a Pagar Criada',
        details: `Conta a pagar "${billData.name}" foi criada.`,
        author: session,
        timestamp: new Date(),
        parameters: billData
    });

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
        
        await actionsHistoryRepository.create({
            action: 'Falha ao Criar Notificação',
            details: `Erro ao criar notificação para conta a pagar "${billData.name}". Erro: ${notificationRes.error}`,
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