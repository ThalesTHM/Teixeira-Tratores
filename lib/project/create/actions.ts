"use server";

import { getUserFromSession } from "@/lib/auth";
import { z } from "zod";
import { adminAuth, adminDB } from "@/firebase/firebase-admin";
import { push, ref, set } from "firebase/database";
import { projectFormSchema } from "./validation";

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

    const uid = session.uid;

    try {
        const projectsRef = adminDB.ref(`projects`);
        const newProjectRef = projectsRef.push();

        await newProjectRef.set({
            name: projectData.name,
            value: projectData.expectedBudget,
            deadline: projectData.deadline,
            description: projectData.description,
            client: projectData.client,
            createdAt: Date.now()
        });
    } catch (error) {
        return {
            success: false,
            error:  "Error Creating Project",
        }
    }

    return {
        success: true,
        error: ""
    }
}