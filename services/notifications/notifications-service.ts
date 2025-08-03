"server only";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";
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
    PROJECT = 'projeto'
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
        const docRef = await adminFirestore.collection('notifications').doc(notificationId).get();
        if (docRef.exists) {
            const data = docRef.data();
            return data?.readBy?.includes(userId) || false;
        }
    } catch (error) {
        return true;
    }
    return true;
}

export class NotificationsService {
    static async getAllNotifications(): Promise<GetAllNotificationsResult> {
        const session = await getUserFromSession();

        if (!session) {
            return { success: false, error: 'User not authenticated' };
        }

        const role = session.role;

        const rolePriority = role === 'admin' ? NotificationRole.ADMIN :
            role === 'manager' ? NotificationRole.MANAGER :
            NotificationRole.EMPLOYEE;

        try {
            const notificationsRef = adminFirestore.collection('notifications');
            const notificationsSnapshot = await notificationsRef
                .where('role', '>=', rolePriority)
                .orderBy('createdAt', 'desc')
                .get();

            const notifications = notificationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return { success: true, notifications };
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return { success: false, error: "Error fetching notifications" };
        }
    }

    static async markNotificationAsRead(notificationId: string): Promise<MarkNotificationAsReadResult> {
        const session = await getUserFromSession();
        
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
                readAt: Date.now()
            });
            return { success: true, error: "" };
        } catch (error) {
            console.error("Error marking notification as read:", error);
            return { success: false, error: "Error marking notification as read" };
        }
    }

    static async markNotificationsAsSoftRead(): Promise<MarkNotificationAsReadResult> {
        const session = await getUserFromSession();
        
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
                        softReadAt: Date.now()
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
                createdAt: Date.now(),
                priority,
                notificationSource,
                slug,
                createdBy,
                role
            };

            const notificationRef = await adminFirestore.collection('notifications').add(notificationData);
            
            return { success: true, notificationId: notificationRef.id, error: "" };
        } catch (error) {
            console.error("Error sending notification:", error);
            return { success: false, error: "Error sending notification" };
        }
    }
}