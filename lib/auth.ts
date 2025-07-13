"use server";

import { adminAuth, adminFirestore, adminDB } from '@/firebase/firebase-admin';
import { create } from 'domain';
import { cookies } from 'next/headers';
import { passwordRecoverySchema, signupFormSchema } from './auth-validation';
import { z } from 'zod';
import { sign } from 'crypto';

const getAllowedPasswordRecovery = async (email: string) => {
  const passwordRecoveryAllowedCollection = adminFirestore.collection('passwordRecoveryAllowed');
  const querySnapshot = await passwordRecoveryAllowedCollection.where('email', '==', email).get();
  if (querySnapshot.empty) {
    return null;
  }
  const allowedData = querySnapshot.docs[0].data();
  return {
    email: allowedData.email,
    code: allowedData.code,
    createdAt: allowedData.createdAt,
  };
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

const doesEmailExist = async (email: string) => {
  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    return userRecord;
  } catch (error) {
    return null;
  }
}

const generatePasswordRecoveryCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
 
  let code = '';
 
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return code;
}

export const changePassword = async (
  { email, code, newPassword, newPasswordConfirmation }:
  { email: string, code: string, newPassword: string, newPasswordConfirmation: string }) => {
    if(!(await doesEmailExist(email))) {
      return { success: false, error: "Email Doesn't Exist" };
    }

    const allowedRecovery = await getAllowedPasswordRecovery(email);

    if (!allowedRecovery) {
      return { success: false, error: "Password recovery not allowed for this email." };
    }

    if (allowedRecovery.code !== code) {
      return { success: false, error: "Invalid recovery code." };
    }

    try {
      await passwordRecoverySchema.parseAsync({ newPassword, newPasswordConfirmation, email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        return { success: false, error: fieldErrors || "Validation failed" };
      }
    }

    try{
      const userRecord = await adminAuth.getUserByEmail(email);
      if (!userRecord) {
        return { success: false, error: "User not found." };
      } 

      await adminAuth.updateUser(userRecord.uid, {
        password: newPassword,
      });
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
    }
    
    try {
      const passwordRecoveryRequestsCollection = adminFirestore.collection('passwordRecoveryRequests');
      const existingRequestForEmail = await passwordRecoveryRequestsCollection
        .where('email', '==', email)
        .get();
    
      if (!existingRequestForEmail.empty) {
        await existingRequestForEmail.docs[0].ref.delete();
      }
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
    }


    try {
      const passwordRecoveryAllowedCollection = adminFirestore.collection('passwordRecoveryAllowed');
      const querySnapshot = await passwordRecoveryAllowedCollection.where('email', '==', email).get();
      
      if (!querySnapshot.empty) {
        await querySnapshot.docs[0].ref.delete();
      }
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true, error: "" };
  }

const generatePasswordRecoveryRequest = async (email: string) => {
  const passwordRecoveryRequestsCollection = adminFirestore.collection('passwordRecoveryRequests');

  const existingRequest = await passwordRecoveryRequestsCollection
    .where('email', '==', email)
    .get();

  if (!existingRequest.empty) {
    return { success: false, error: "Password recovery request already exists for this email." };
  }
  
  await passwordRecoveryRequestsCollection.add(
    {
      email,
      createdAt: Date.now(),
    }
  )

  return { success: true, error: "" };
}

export const denyPasswordRecoveryRequest = async (email: string) => {
  const session = await getUserFromSession();
  
  if (!session) {
    throw new Error("User Not Authenticated");
  }

  if (session.role !== 'admin') {
    throw new Error("User Not Authorized");
  }

  if (!(await doesEmailExist(email))) {
    throw new Error("Email Doesn't Exist");
  }

  const passwordRecoveryRequestsCollection = adminFirestore.collection('passwordRecoveryRequests');

  const existingRequest = await passwordRecoveryRequestsCollection
    .where('email', '==', email)
    .get();

  if (existingRequest.empty) {
    return { success: false, error: "No active password recovery request found for this email." };
  }

  await existingRequest.docs[0].ref.delete();

  if(await getAllowedPasswordRecovery(email)) {
    const passwordRecoveryAllowedCollection = adminFirestore.collection('passwordRecoveryAllowed');
    
    const allowedSnapshot = await passwordRecoveryAllowedCollection
      .where('email', '==', email)
      .get();
    
    if (!allowedSnapshot.empty) {
      await allowedSnapshot.docs[0].ref.delete();
    }
  }

  return { success: true, error: "" };
}

export const allowPasswordRecovery = async (email: string) => {
  const session = await getUserFromSession();
  
  if (!session) {
    throw new Error("User Not Authenticated");
  }

  if (session.role !== 'admin') {
    throw new Error("User Not Authorized");
  }

  if (!(await doesEmailExist(email))) {
    throw new Error("Email Doesn't Exist");
  }

  try {
    const passwordRecoveryAllowedCollection = adminFirestore.collection('passwordRecoveryAllowed');

    const existingRequest = await passwordRecoveryAllowedCollection
      .where('email', '==', email)
      .get();

    if (!existingRequest.empty) {
      return { success: false, error: "Password recovery already allowed for this email."}
    }

    const code = generatePasswordRecoveryCode();

    passwordRecoveryAllowedCollection.add(
      {
        email,
        code,
        createdAt: Date.now(),
      }
    );

    const passwordRecoveryRequestsCollection = adminFirestore.collection('passwordRecoveryRequests');

    return { success: true, code, error: "" };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: "Internal Server Error" };
}

export const requestPasswordRecovery = async ({ email } : { email: string }) => {
  try {
    if(!(await doesEmailExist(email))) {
      return { success: false, error: "Email Doesn't Exist" };
    }
    
    return await generatePasswordRecoveryRequest(email);
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: "Internal Server Error" };
}

const createUserDocument = async (email: string, uid: string) => {
  const emailInvite = await getEmailInvite(email);

  if (!emailInvite) {
    throw new Error("Email Invite Not Found");
  }

  const userData = {
    email: emailInvite.email,
    name: emailInvite.name || "",
    role: emailInvite.role || "",
    pnumber: emailInvite.pnumber || "",
    cpf: emailInvite.cpf || "",
    address: emailInvite.address || "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await adminDB.ref(`users/${uid}`).set(userData);
}

const setEmailInviteUsed = async (email: string) => {
  const emailKey = email.replace(/\./g, ',');
  const ref = adminDB.ref(`emailInvites/${emailKey}`);
  const snapshot = await ref.once('value');

  if (!snapshot.exists()) {
    return false;
  }
 
  await ref.update({ used: true });
 
  return true;
}

const getEmailInvite = async (email: string) => {
  const emailKey = email.replace(/\./g, ',');
  const snapshot = await adminDB.ref(`emailInvites/${emailKey}`).once('value');

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val();
}

export const createUser = async ({ email, password }: { email: string, password: string }) => {
  try {
    const emailInvite = await getEmailInvite(email);

    if (!emailInvite) {
      return { success: false, userToken: null, error: "Email Invite Not Found" };
    }

    if(emailInvite.used) {
      return { success: false, userToken: null, error: "Email Already Registered" };
    }

    const userRecord = await adminAuth.createUser({
      email,
      password
    });

    try {
      await signupFormSchema.parseAsync({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        return { success: false, userToken: null, error: fieldErrors || "Validation failed" };
      }
    }

    await setEmailInviteUsed(email);
    await createUserDocument(email, userRecord.uid);

    const token = await adminAuth.createCustomToken(userRecord.uid, { role: emailInvite.role });

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

export const logout = async (formData: FormData) : Promise<void> => {
  const cookie = await cookies()
  
  cookie.delete({
    name: 'session',
    path: '/',
  });
}