"use server";

import { adminAuth } from '@/firebase/firebase-admin';
import { cookies } from 'next/headers';

export const createSession = async ({ idToken }: { idToken: string }) => {
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  
  try{
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookie = await cookies();

    cookie.set('session', sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: expiresIn / 1000,
        path: '/',
    });
  } catch (error) {
    if(error instanceof Error){
        return { success: false, error: error.message }
    }
  }

  return { success: true, error: "" }
}

export const getUserFromSession = async () => {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded;
  } catch (err) {
    return null;
  }
}

export const logout = async (formData: FormData) : Promise<void> => {
  const cookie = await cookies()
  
  cookie.delete({
    name: 'session',
    path: '/',
  });

}