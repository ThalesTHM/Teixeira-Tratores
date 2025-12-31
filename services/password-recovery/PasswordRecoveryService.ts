import { PasswordRecoveryRequestsRepository } from "@/database/repositories/Repositories";
import { AuthService } from "../auth/AuthService";
import { adminFirestore } from "@/firebase/firebase-admin";

export class PasswordRecoveryService {
    private passwordRecoveryRequestsRepository = new PasswordRecoveryRequestsRepository();
    private authService = new AuthService();

    async createPasswordRecoveryRequest(email: string): Promise<void> {
        await this.passwordRecoveryRequestsRepository.create({ email });
    }

    async changePassword(email: string, code: string, newPassword: string): Promise<void> {
        const allowedRecovery = await this.passwordRecoveryRequestsRepository.findAllowedByEmail(email);
        
        if (!allowedRecovery || allowedRecovery.code !== code) {
            throw new Error("Invalid recovery code");
        }
        
        const userRecord = await this.authService.getUserByEmail(email);
        await this.authService.updateUserPassword(userRecord.uid, newPassword);
        
        // Mark as used instead of deleting (this will hide it from all lists)
        await this.passwordRecoveryRequestsRepository.markAsUsed(allowedRecovery.id);
    }

    async allowPasswordRecovery(email: string): Promise<string> {
        const code = this.generatePasswordRecoveryCode();
        
        // Update the original request with code and soft delete it (mark as allowed)
        await this.passwordRecoveryRequestsRepository.allowPasswordRecovery(email, code);
        
        return code;
    }

    async denyPasswordRecoveryRequest(email: string): Promise<void> {
        // Mark as denied and soft delete (preserves data for audit)
        await this.passwordRecoveryRequestsRepository.markAsDenied(email);
    }

    private generatePasswordRecoveryCode(): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    }
}