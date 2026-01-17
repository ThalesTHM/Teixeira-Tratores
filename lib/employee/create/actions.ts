"use server";

import { SessionService } from "@/services/session/SessionService";
import { EmployeeService } from "@/services/employee/EmployeeService";
import { z } from "zod";
import { employeeFormSchema } from "./validation";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";
import { ActionsHistoryRepository } from "@/database/repositories/Repositories";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const createEmployee = async (formData: FormData) => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();

    if (!session) {
        await actionsHistoryRepository.create({
            action: 'Falha na Criação de Funcionário',
            details: `Tentativa de criar funcionário sem autenticação.`,
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

    const employeeData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as string,
        pnumber: formData.get('pnumber') as string,
        cpf: formData.get('cpf') as string,
        address: formData.get('address') as string
    }

    try {
        await employeeFormSchema.parseAsync(employeeData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const fieldErrors = error.flatten().fieldErrors;

            await actionsHistoryRepository.create({
                action: 'Falha na Criação de Funcionário',
                details: `Falha na validação ao criar funcionário "${employeeData.name}".`,
                author: session,
                timestamp: new Date(),
                parameters: {
                    ...employeeData,
                    validationErrors: fieldErrors
                }
            });

            return {
                success: false,
                error: fieldErrors
            }
        }
    }

    const createResult = await EmployeeService.createEmployee(employeeData);
    
    if (!createResult.success) {
        await actionsHistoryRepository.create({
            action: 'Falha na Criação de Funcionário',
            details: `Erro ao criar funcionário "${employeeData.name}". Erro: ${createResult.error || "Erro desconhecido"}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...employeeData,
                error: createResult.error
            }
        });

        return {
            success: false,
            error: createResult.error || "Error Creating Employee",
        }
    }

    await actionsHistoryRepository.create({
        action: 'Funcionário Criado',
        details: `Funcionário "${employeeData.name}" foi criado.`,
        author: session,
        timestamp: new Date(),
        parameters: {
            ...employeeData,
            slug: createResult.slug
        }
    });

    const notification = {
        message: `Funcionário "${employeeData.name}" Foi Convidado.`,
        role: NotificationRole.MANAGER,
        createdBy: session.name,
        slug: createResult.slug!,
        notificationSource: NotificationSource.EMPLOYEE
    }
    
    const notificationRes = await NotificationsService.createNotification(notification);

    if (!notificationRes.success) {
        console.error("Error creating notification:", notificationRes.error);

        await actionsHistoryRepository.create({
            action: 'Falha ao Criar Notificação',
            details: `Erro ao criar notificação para funcionário "${employeeData.name}". Erro: ${notificationRes.error}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...employeeData,
                slug: createResult.slug,
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