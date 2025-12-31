"use server";

import { signupFormSchema } from './auth-validation';
import { z } from 'zod';
import { UserRegistrationService } from '@/services/user-registration/UserRegistrationService';
import { SessionService } from '@/services/session/SessionService';

const userRegistrationService = new UserRegistrationService();
const sessionService = new SessionService();

// Authentication actions only - password recovery moved to lib/password-recovery/actions.ts

export const createUser = async ({ email, password }: { email: string, password: string }) => {
  try {
    // Validation - keep in actions
    try {
      await signupFormSchema.parseAsync({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        return { success: false, userToken: null, error: fieldErrors || "Validation failed" };
      }
    }

    // Check if user is already registered
    if (await userRegistrationService.isUserRegistered(email)) {
      return { success: false, userToken: null, error: "Email Already Registered" };
    }

    // Delegate business logic to service - now activates existing invite instead of creating new user
    try {
      const token = await userRegistrationService.activateUser(email, password);
      return { success: true, userToken: token, error: "" };
    } catch (serviceError) {
      return { success: false, userToken: null, error: serviceError instanceof Error ? serviceError.message : "Unknown error" };
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, userToken: null, error: error.message };
    }
  }
  
  return { success: false, userToken: null, error: "Internal Server Error" };
}

export const createSession = async ({ idToken }: { idToken: string }) => {
  try {
    // Delegate to SessionService
    return await sessionService.createUserSession({ idToken });
  } catch (error) {
    if(error instanceof Error){
      return { success: false, error: error.message }
    }
    return { success: false, error: "Unknown error" };
  }
}

export const logout = async (formData: FormData) : Promise<void> => {
  // Delegate to SessionService
  await sessionService.destroyUserSession();
}