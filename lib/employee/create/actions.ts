"use server";

import { SessionService } from "@/services/session/SessionService";
import { EmployeeService } from "@/services/employee/EmployeeService";
import { z } from "zod";
import { employeeFormSchema } from "./validation";
import { NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

export const createEmployee = async (formData: FormData) => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();

    if (!session) {
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

            return {
                success: false,
                error: fieldErrors
            }
        }
    }

    const createResult = await EmployeeService.createEmployee(employeeData);
    
    if (!createResult.success) {
        return {
            success: false,
            error: createResult.error || "Error Creating Employee",
        }
    }

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