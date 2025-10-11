"use server";

import { getUserFromSession } from "@/lib/auth";
import { z } from "zod";
import { adminAuth, adminFirestore } from "@/firebase/firebase-admin";
import { projectFormSchema } from "./validation";
import { customAlphabet } from "nanoid";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

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
    const session = await getUserFromSession();

    if (!session) {
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

            return {
                success: false,
                error: fieldErrors
            }
        }
    }

    const slug = generateSlug((projectData.name ?? "") as string);

    try {
        const projectsCollection = adminFirestore.collection('projects');
        await projectsCollection.add({
            name: projectData.name,
            expectedBudget: projectData.expectedBudget,
            deadline: projectData.deadline,
            description: projectData.description,
            client: projectData.client,
            createdAt: Date.now(),
            slug
        });
    } catch (error) {
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