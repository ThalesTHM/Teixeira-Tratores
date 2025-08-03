"use server";

import { NotificationsService } from "@/services/notifications/notifications-service";

export const markNotificationsAsSoftRead = async () => {
    return NotificationsService.markNotificationsAsSoftRead();
}

export const marknotificaitonsAsRead = async (notificationId: string) => {
    return NotificationsService.markNotificationAsRead(notificationId);
}