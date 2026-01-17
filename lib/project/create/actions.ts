"use server";

import { SessionService } from "@/services/session/SessionService";
import { z } from "zod";
import { ProjectsRepository, ActionsHistoryRepository } from "@/database/repositories/Repositories";
import { projectFormSchema } from "./validation";
import { customAlphabet } from "nanoid";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);
const actionsHistoryRepository = new ActionsHistoryRepository();

function generateSlug(name: string) {
    return [
        name?.toString().toLowerCase().replace(/\s+/g, "-") || "project",
        nanoid(),
        nanoid(),
        nanoid(),
        nanoid()
    ].join('-');
}

export const createProject = async (formData: FormData) => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();

    if (!session) {
        await actionsHistoryRepository.create({
            action: 'Falha na Criação de Projeto',
            details: `Tentativa de criar projeto sem autenticação.`,
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

    const projectData = {
        name: formData.get('name'),
        expectedBudget: Number(formData.get('expectedBudget')),
        deadline: (new Date(formData.get('deadline') as string)).getTime(),
        description: formData.get('description'),
        client: formData.get('client')
    }

    try{
        await projectFormSchema.parseAsync(projectData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const fieldErrors = error.flatten().fieldErrors;

            await actionsHistoryRepository.create({
                action: 'Falha na Criação de Projeto',
                details: `Falha na validação ao criar projeto "${projectData.name}".`,
                author: session,
                timestamp: new Date(),
                parameters: {
                    ...projectData,
                    validationErrors: fieldErrors
                }
            });

            return {
                success: false,
                error: fieldErrors
            }
        }
    }

    const slug = generateSlug((projectData.name ?? "") as string);

    try {
        const projectsRepository = new ProjectsRepository();
        await projectsRepository.create({
            name: projectData.name,
            expectedBudget: projectData.expectedBudget,
            deadline: projectData.deadline,
            description: projectData.description,
            client: projectData.client,
            slug
        });

        await actionsHistoryRepository.create({
            action: 'Projeto Criado',
            details: `Projeto "${projectData.name}" foi criado.`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...projectData,
                slug
            }
        });
    } catch (error) {
        await actionsHistoryRepository.create({
            action: 'Falha na Criação de Projeto',
            details: `Erro ao criar projeto "${projectData.name}". Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...projectData,
                slug,
                error: error instanceof Error ? error.message : "Error Creating Project"
            }
        });

        return {
            success: false,
            error:  "Error Creating Project",
        }
    }

    const notification = {
        message: `Projeto "${projectData.name}" Foi Criado.`,
        role: NotificationRole.MANAGER,
        slug,
        createdBy: session.name,
        notificationSource: NotificationSource.PROJECT
    }
    
    const notificationRes = await NotificationsService.createNotification(notification);

    if (!notificationRes.success) {
        console.error("Error creating notification:", notificationRes.error);

        await actionsHistoryRepository.create({
            action: 'Falha ao Criar Notificação',
            details: `Erro ao criar notificação para projeto "${projectData.name}". Erro: ${notificationRes.error}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                ...projectData,
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