"use server";

import { adminFirestore } from '@/firebase/firebase-admin';
import { passwordRecoverySchema } from './password-recovery-validation';
import { z } from 'zod';
import { PasswordRecoveryRequestsRepository } from '@/database/repositories/Repositories';
import { AuthService } from '@/services/auth/AuthService';
import { PasswordRecoveryService } from '@/services/password-recovery/PasswordRecoveryService';
import { SessionService } from '@/services/session/SessionService';

const authService = new AuthService();
const passwordRecoveryService = new PasswordRecoveryService();
const passwordRecoveryRequestsRepository = new PasswordRecoveryRequestsRepository();
const sessionService = new SessionService();

export const changePassword = async (
  { email, code, newPassword, newPasswordConfirmation }:
  { email: string, code: string, newPassword: string, newPasswordConfirmation: string }
) => {
    // Validation - keep in actions
    if(!(await authService.doesEmailExist(email))) {
      return { success: false, error: "Email Doesn't Exist" };
    }

    const allowedRecovery = await passwordRecoveryRequestsRepository.findAllowedByEmail(email);

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

    // Delegate business logic to service
    try {
      await passwordRecoveryService.changePassword(email, code, newPassword);
      return { success: true, error: "" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

const generatePasswordRecoveryRequest = async (email: string) => {
  const passwordRecoveryRequest = await passwordRecoveryRequestsRepository.findByEmail(email);
  
  console.log(passwordRecoveryRequest);

  if (passwordRecoveryRequest) {
    return { success: false, error: "Password recovery request already exists for this email." };
  }
  
  try {
    await passwordRecoveryService.createPasswordRecoveryRequest(email);
    return { success: true, error: "" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export const denyPasswordRecoveryRequest = async (email: string) => {
  // Authentication & Authorization - keep in actions
  const session = await sessionService.getUserFromSession();
  
  if (!session) {
    return { success: false, error: "User Not Authenticated" };
  }

  if (session.role !== 'admin') {
    return { success: false, error: "User Not Authorized" };
  }

  // Email validation - keep in actions
  if (!(await authService.doesEmailExist(email))) {
    return { success: false, error: "Email Doesn't Exist" };
  }

  const existingRequest = await passwordRecoveryRequestsRepository.findByEmail(email);

  if (!existingRequest) {
    return { success: false, error: "No active password recovery request found for this email." };
  }

  // Delegate business logic to service
  try {
    await passwordRecoveryService.denyPasswordRecoveryRequest(email);
    return { success: true, error: "" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export const allowPasswordRecovery = async (email: string) => {
  // Authentication & Authorization - keep in actions
  const session = await sessionService.getUserFromSession();
  
  if (!session) {
    return { success: false, error: "User Not Authenticated" };
  }

  if (session.role !== 'admin') {
    return { success: false, error: "User Not Authorized" };
  }

  // Email validation - keep in actions
  if (!(await authService.doesEmailExist(email))) {
    return { success: false, error: "Email Doesn't Exist" };
  }

  const existingRequest = await passwordRecoveryRequestsRepository.findAllowedByEmail(email);

  if (existingRequest) {
    return { success: false, error: "Password recovery already allowed for this email." };
  }

  // Delegate business logic to service
  try {
    const code = await passwordRecoveryService.allowPasswordRecovery(email);
    return { success: true, code, error: "" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export const requestPasswordRecovery = async ({ email } : { email: string }) => {
  try {
    // Email validation - keep in actions
    if(!(await authService.doesEmailExist(email))) {
      return { success: false, error: "Email Doesn't Exist" };
    }
    
    // Delegate business logic to service
    return await generatePasswordRecoveryRequest(email);
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: "Internal Server Error" };
}
