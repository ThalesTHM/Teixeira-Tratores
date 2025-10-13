"use server";

import { getUserFromSession } from "@/lib/auth";
import { EmployeeHoursRepository } from "@/database/repositories/Repositories";
import { EmployeeHourFormSchema } from "./validations";
import { z } from "zod";
import { NotificationPriority, NotificationRole, NotificationSource } from "@/services/notifications/NotificationsService";
import { nanoid } from "nanoid";
import { NotificationsService } from "@/services/notifications/NotificationsService";
import { StorageService } from "@/services/storage/StorageService";

function generateSlug() {
    return [nanoid(), nanoid(), nanoid(), nanoid()].join('-');
}

export const createEmployeeHour = async (formData: FormData) => {
    const session = await getUserFromSession();

    if (!session) {
        return {
            success: false,
            error: "User Not Authenticated",
        }
    }

    const employeeHourData: {
    date: string;
    startingHour: string;
    totalTime: string;
    project: string;
    description: string;
    hourMeter?: File | null;
    } = {
        date: formData.get('date') as string,
        startingHour: formData.get('startingHour') as string,
        totalTime: formData.get('totalTime') as string,
        project: formData.get('project') as string,
        description: formData.get('description') as string,
        hourMeter: formData.get('hourMeter') as File | null,
    };

    try{
        await EmployeeHourFormSchema.parseAsync(employeeHourData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const fieldErrors = error.flatten().fieldErrors;
            return {
                success: false,
                error: fieldErrors
            }
        }
    }

    const slug = generateSlug();

    const storageService = new StorageService();

    let imagePath;

    if (employeeHourData.hourMeter) {
        try {
            imagePath = await storageService.uploadFile(employeeHourData.hourMeter, `employeeHours/${slug}/hourMeter-${employeeHourData.hourMeter.name}`);
        } catch (error) {
            console.log("error: ", error);

            return {
                success: false,
                error: "Error Uploading Hour Meter File"
            }
        }
    } else {
        return {
            success: false,
            error: "Hour Meter File is required"
        }
    }

    delete employeeHourData.hourMeter;

    const employeeHour = {
        ...employeeHourData,
        imagePath,
        slug
    };

    try {
        const employeeHoursRepository = new EmployeeHoursRepository();
        await employeeHoursRepository.create(employeeHour);
    } catch (error) {
        console.log("error: ", error);

        return {
            success: false,
            error: "Error Creating Employee Hour"
        }
    }

    const notification = {
        message: `Funcionário ${session.name} registrou horas ${employeeHour.totalTime} no projeto ${employeeHour.project}.`,
        role: NotificationRole.MANAGER,
        slug,
        createdBy: session.name,
        notificationSource: NotificationSource.EMPLOYEE_HOUR,
        priority: NotificationPriority.ZERO,
    }

    const notificationRes = await NotificationsService.createNotification(notification);
    
    if (!notificationRes.success) {
        return { success: false, error: 'Error creating notification' };
    }

    return { success: true };
};