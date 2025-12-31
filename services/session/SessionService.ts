import { UsersRepository } from "@/database/repositories/Repositories";
import { adminAuth } from "@/firebase/firebase-admin";
import { cookies } from "next/headers";

export class SessionService {
    private usersRepository = new UsersRepository();

    async getAdminUserFromSession() {
        const session = await this.getUserFromSession();

        if (!session) {
            throw new Error("User not authenticated.");
        }

        const role = session.role;

        if (role !== 'admin' && role !== 'manager') {
            throw new Error("User not authorized.");
        }

        return session;
    }

    async getUserFromSession() {
          const sessionCookie = (await cookies()).get('session')?.value;
          if (!sessionCookie) return null;
        
          try {
            const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

            const user = await this.usersRepository.findById(decoded.uid);

            return { ...decoded, ...user };
          } catch (err) {
            return null;
          }
    }

    async createUserSession({ idToken }: { idToken: string }) {
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
  
        try {
            const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

            const cookie = await cookies();

            cookie.set('session', sessionCookie, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: expiresIn / 1000,
                path: '/'
            });
        } catch (error) {
            throw error;
        }

        return { success: true, error: "" }
    }

    async destroyUserSession() {
        const cookie = await cookies();
  
        cookie.delete({
            name: 'session',
            path: '/',
        });
    }
}