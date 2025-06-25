"use server";

import { adminAuth, adminFirestore } from '@/firebase/firebase-admin';
import { create } from 'domain';
import { cookies } from 'next/headers';

const createUserDocument = async (email: string) => {
  const userCollection = adminFirestore.collection('users');
  
  const emailInvite = await getEmailInvite(email);

  if (!emailInvite) {
    throw new Error("Email Invite Not Found");
  }

  const userData = {
    email: emailInvite.email,
    name: emailInvite.name || "",
    position: emailInvite.position || "",
    pnumber: emailInvite.pnumber || "",
    cpf: emailInvite.cpf || "",
    address: emailInvite.address || "",
  }

  await userCollection.add({
    ...userData,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

const setEmailInviteUsed = async (email: string) => {
  const invitesCollection = adminFirestore.collection('emailInvites');
  const querySnapshot = await invitesCollection.where('email', '==', email).get();

  if (querySnapshot.empty) {
    return false;
  }
 
  const inviteDoc = querySnapshot.docs[0];
  await inviteDoc.ref.update({ used: true });
 
  return true;
}

const getEmailInvite = async (email: string) => {
  const invitesCollection = adminFirestore.collection('emailInvites');
  const querySnapshot = await invitesCollection.where('email', '==', email).get();

  if (querySnapshot.empty) {
    return null;
  }

  const inviteData = querySnapshot.docs[0].data();
  return inviteData;
}

const getUserInfoByUID = async (uid: string) => {
  const userCollection = adminFirestore.collection('users').doc(uid);
  const userSnapshot = await userCollection.get();
  
  if (!userSnapshot.exists) {
    return null;
  }

  const userData = userSnapshot.data();

  return userData;
}

const isEmailAlreadyRegistered = async (emailInvite: any) => {
  return emailInvite.used;
}

export const createUser = async ({ email, password }: { email: string, password: string }) => {
  try {
    const emailInvite = await getEmailInvite(email);

    if (!emailInvite) {
      return { success: false, userToken: null, error: "Email Invite Not Found" };
    }

    if(await isEmailAlreadyRegistered(emailInvite)) {
      return { success: false, userToken: null, error: "Email Already Registered" };
    }

    const userRecord = await adminAuth.createUser({
      email,
      password
    });

    await setEmailInviteUsed(email);
    await createUserDocument(email);

    const token = await adminAuth.createCustomToken(userRecord.uid, { role: 'emailInvite.role' });

    return { success: true, userToken: token, error: "" };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, userToken: null, error: error.message };
    }
  }
  
  return { success: false, userToken: null, error: "Internal Server Error" };
}

export const createSession = async ({ idToken }: { idToken: string }) => {
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  
  try{
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookie = await cookies();

    cookie.set('session', sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: expiresIn / 1000,
        path: '/'
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
    
    const user = await getUserInfoByUID(decoded.uid);
    return { ...decoded, ...user };
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