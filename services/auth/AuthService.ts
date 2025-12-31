import { adminAuth } from '@/firebase/firebase-admin';

export class AuthService {
    async doesEmailExist(email: string): Promise<boolean> {
        try {
            const userRecord = await adminAuth.getUserByEmail(email);
            return !!userRecord;
        } catch (error) {
            if ((error as any).code === 'auth/user-not-found') {
                return false;
            }
            throw error;
        }
    }

    async getUserByEmail(email: string): Promise<any> {
        try {
            const userRecord = await adminAuth.getUserByEmail(email);
            return userRecord;
        } catch (error) {
            throw error;
        }
    }

    async updateUserPassword(uid: string, newPassword: string): Promise<void> {
        try {
            await adminAuth.updateUser(uid, { password: newPassword });
        } catch (error) {
            throw error;
        }
    }

    async createUser(email: string, password: string): Promise<any> {
        try {
            const userRecord = await adminAuth.createUser({
                email,
                password,
            });
            return userRecord;
        } catch (error) {
            throw error;
        }
    }

    async deleteUser(uid: string): Promise<void> {
        try {
            await adminAuth.deleteUser(uid);
        } catch (error) {
            throw error;
        }
    }
}