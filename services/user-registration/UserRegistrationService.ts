import { AuthService } from "../auth/AuthService";
import { NotificationRole, NotificationSource, NotificationsService } from "../notifications/NotificationsService";
import { adminFirestore, adminAuth } from "@/firebase/firebase-admin";
import { UsersRepository } from "@/database/repositories/Repositories";

export interface UserData {
    email: string;
    name?: string;
    role?: string;
    pnumber?: string;
    cpf?: string;
    address?: string;
    slug?: string;
    used?: boolean;
}

export class UserRegistrationService {
    private authService = new AuthService();
    private usersRepository = new UsersRepository();

    async activateUser(email: string, password: string): Promise<string> {
        // Find the user in users collection
        const user = await this.usersRepository.findByEmail(email);
        
        if (!user) {
            throw new Error("Email Invite Not Found");
        }

        if (user.used) {
            throw new Error("Email Already Registered");
        }

        // Create Firebase Auth user
        const userRecord = await this.authService.createUser(email, password);
        
        // Mark user as used (activated)
        await this.usersRepository.update(user.id, { used: true });

        // Create notification
        const notification = {
            message: `Funcionário "${user.name || email}" Registrou a Sua Conta.`,
            role: NotificationRole.MANAGER,
            createdBy: user.name || email,
            notificationSource: NotificationSource.EMPLOYEE
        };
        
        const notificationRes = await NotificationsService.createNotification(notification);

        if (!notificationRes.success) {
            console.error("Error creating notification:", notificationRes.error);
            throw new Error("Error creating notification");
        }

        const token = await adminAuth.createCustomToken(userRecord.uid);
        
        return token;
    }



    async markUserAsUsed(email: string): Promise<void> {
        const user = await this.usersRepository.findByEmail(email);
        
        if (user) {
            await this.usersRepository.update(user.id, { used: true });
        }
    }

    async getUserByEmail(email: string): Promise<any> {
        return await this.authService.getUserByEmail(email);
    }

    async doesEmailExist(email: string): Promise<boolean> {
        return await this.authService.doesEmailExist(email);
    }

    async isUserRegistered(email: string): Promise<boolean> {
        const user = await this.usersRepository.findByEmail(email);
        
        if (!user) {
            return false;
        }
        
        return user.used === true;
    }
}