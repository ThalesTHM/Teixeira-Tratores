"server only";

import { NotificationsRepository } from "@/database/repositories/Repositories";
import { adminFirestore } from "@/firebase/firebase-admin";
import { SessionService } from "@/services/session/SessionService";
import { FieldValue } from "firebase-admin/firestore";

export enum NotificationPriority {
    ZERO = 'zero',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export enum NotificationSource {
    SYSTEM = 'system',
    SUPPLIER = 'funcionario',
    BILL_TO_PAY = 'conta/conta-a-pagar',
    BILL_TO_RECEIVE = 'conta/conta-a-receber',
    CLIENT = 'cliente',
    PROJECT = 'projeto',
    EMPLOYEE = 'funcionario',
    EMAIL_INVITE = 'funcionario/convites',
    EMPLOYEE_HOUR = 'funcionario-horas',
}

export enum NotificationRole {
    ADMIN = 0,
    MANAGER = 1,
    EMPLOYEE = 2
}

export type GetAllNotificationsResult = {
    success: boolean;
    notifications?: any[];
    error?: string;
};

export type MarkNotificationAsReadResult = {
    success: boolean;
    error?: string;
};

export type CreateNotificationResult = {
    success: boolean;
    notificationId?: string;
    error?: string;
};

const isAlreadyRead = async (notificationId: string, userId: string): Promise<boolean> => {
    try {
        const notificationsRepository = new NotificationsRepository();
        const notification = await notificationsRepository.findById(notificationId);
        if (notification) {
            return notification.readBy?.includes(userId) || false;
        }
    } catch (error) {
        return true;
    }
    return true;
}

export class NotificationsService {
    private static sessionService = new SessionService();
    
    static async getAllNotifications(): Promise<GetAllNotificationsResult> {
        const session = await NotificationsService.sessionService.getUserFromSession();

        if (!session) {
            return { success: false, error: 'User not authenticated' };
        }

        const role = session.role;

        const rolePriority = role === 'admin' ? NotificationRole.ADMIN :
            role === 'manager' ? NotificationRole.MANAGER :
            NotificationRole.EMPLOYEE;

        try {
            const notificationsRepository = new NotificationsRepository();
            const notifications = await notificationsRepository.findByField('role', rolePriority);

            // Sort by createdAt descending (most recent first)
            const sortedNotifications = notifications.sort((a, b) => {
                const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
                const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
                return bTime - aTime;
            });

            return { success: true, notifications: sortedNotifications };
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return { success: false, error: "Error fetching notifications" };
        }
    }

    static async markNotificationAsRead(notificationId: string): Promise<MarkNotificationAsReadResult> {
        const session = await NotificationsService.sessionService.getUserFromSession();
        
        if (!session) {
            return { success: false, error: 'User not authenticated' };
        }
        
        const userId = session.uid;

        if (await isAlreadyRead(notificationId, userId)) {
            return { success: true, error: "" };
        }

        try {
            const notificationRef = adminFirestore.collection('notifications').doc(notificationId);
            await notificationRef.update({
                readBy: FieldValue.arrayUnion(userId),
                readAt: new Date()
            });
            return { success: true, error: "" };
        } catch (error) {
            console.error("Error marking notification as read:", error);
            return { success: false, error: "Error marking notification as read" };
        }
    }

    static async markNotificationsAsSoftRead(): Promise<MarkNotificationAsReadResult> {
        const session = await NotificationsService.sessionService.getUserFromSession();
        
        if (!session) {
            return { success: false, error: 'User not authenticated' };
        }

        const userId = session.uid;

        try {
            const notificationsRef = adminFirestore.collection('notifications');
            const notificationsSnapshot = await notificationsRef.get();
            const batch = adminFirestore.batch();
            notificationsSnapshot.docs.forEach(doc => {
                const docData = doc.data();
                if(docData.softReadBy && !docData.softReadBy.includes(userId)) {
                    batch.update(doc.ref, {
                        softReadBy: FieldValue.arrayUnion(userId),
                        softReadAt: new Date()
                    });
                }
            });
            await batch.commit();
            return { success: true, error: "" };
        } catch (error) {
            console.error("Error marking all notifications as soft read:", error);
            return { success: false, error: "Error marking all notifications as soft read" };
        }
    }

    static async createNotification({
        message,
        role = NotificationRole.EMPLOYEE,
        priority = NotificationPriority.ZERO,
        notificationSource = NotificationSource.SYSTEM,
        slug = null,
        createdBy = "SYSTEM"
    }: {
        message: string,
        priority?: NotificationPriority,
        notificationSource?: NotificationSource,
        slug?: string | null,
        createdBy?: string,
        role?: NotificationRole
    }): Promise<CreateNotificationResult> 
    {
        try {
            const notificationData = {
                message,
                readBy: [],
                softReadBy: [],
                priority,
                notificationSource,
                slug,
                createdBy,
                role
            };

            const notificationsRepository = new NotificationsRepository();
            const result = await notificationsRepository.create(notificationData);
            
            return { success: true, notificationId: result.id, error: "" };
        } catch (error) {
            console.error("Error sending notification:", error);
            return { success: false, error: "Error sending notification" };
        }
    }
}