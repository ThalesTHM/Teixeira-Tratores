"use server";

import { signupFormSchema } from './auth-validation';
import { z } from 'zod';
import { UserRegistrationService } from '@/services/user-registration/UserRegistrationService';
import { SessionService } from '@/services/session/SessionService';
import { ActionsHistoryRepository } from '@/database/repositories/Repositories';

const userRegistrationService = new UserRegistrationService();
const sessionService = new SessionService();
const actionsHistoryRepository = new ActionsHistoryRepository();

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
      await actionsHistoryRepository.create({
        action: 'Falha no Registro de Usuário',
        details: `Tentativa de registro com email já cadastrado: ${email}`,
        author: email,
        timestamp: new Date(),
        parameters: {
          email,
          password: 'redacted'
        }
      });

      return { success: false, userToken: null, error: "Email Already Registered" };
    }

    // Delegate business logic to service - now activates existing invite instead of creating new user
    try {
      const token = await userRegistrationService.activateUser(email, password);

      await actionsHistoryRepository.create({
        action: 'Registro de Usuário',
        details: `Usuário registrado com email: ${email}`,
        author: email,
        timestamp: new Date(),
        parameters: {
          email,
          password: 'redacted'
        }
      });

      return { success: true, userToken: token, error: "" };
    } catch (serviceError) {
      await actionsHistoryRepository.create({
        action: 'Falha no Registro de Usuário',
        details: `Falha no registro de usuário para o email: ${email}. Erro: ${serviceError instanceof Error ? serviceError.message : "Erro desconhecido"}`,
        author: email,
        timestamp: new Date(),
        parameters: {
          email,
          password: 'redacted',
          error: serviceError instanceof Error ? serviceError.message : "Erro desconhecido"
        }
      });

      return { success: false, userToken: null, error: serviceError instanceof Error ? serviceError.message : "Unknown error" };
    }
  } catch (error) {
    if (error instanceof Error) {
      await actionsHistoryRepository.create({
        action: 'Falha no Registro de Usuário',
        details: `Falha no registro de usuário para o email: ${email}. Erro: ${error.message}`,
        author: email,
        timestamp: new Date(),
        parameters: {
          email,
          password: 'redacted',
          error: error.message
        }
      });
      
      return { success: false, userToken: null, error: error.message };
    }
  }
  
  return { success: false, userToken: null, error: "Internal Server Error" };
}

export const createSession = async ({ idToken }: { idToken: string }) => {
  try {
    // Delegate to SessionService
    const idTokenResult = await sessionService.createUserSession({ idToken });

    await actionsHistoryRepository.create({
      action: 'Sessão de usuário criada',
      details: `Sessão de usuário criada com token.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        idToken: 'redacted'
      }
    });

    return { success: true, sessionToken: idTokenResult, error: "" };
  } catch (error) {
    if(error instanceof Error){
      await actionsHistoryRepository.create({
        action: 'Falha na criação de sessão de usuário',
        details: `Falha na criação de sessão de usuário. Erro: ${error.message}`,
        author: null,
        timestamp: new Date(),
        parameters: {
          idToken: 'redacted',
          error: error.message
        }
      });

      return { success: false, error: error.message }
    }

    await actionsHistoryRepository.create({
      action: 'Falha na criação de sessão de usuário',
      details: `Falha na criação de sessão de usuário devido a erro desconhecido.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        idToken: 'redacted'
      }
    });

    return { success: false, error: "Unknown error" };
  }
}

export const logout = async (formData: FormData) : Promise<void> => {
  const session = await sessionService.getUserFromSession();
  
  await actionsHistoryRepository.create({
    action: 'Usuário desconectado',
    details: `Usuário desconectado.`,
    author: session,
    timestamp: new Date(),
    parameters: {
      userId: session || null
    }
  });

  // Delegate to SessionService
  await sessionService.destroyUserSession();
}