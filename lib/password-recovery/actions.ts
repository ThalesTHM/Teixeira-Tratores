"use server";

import { adminFirestore } from '@/firebase/firebase-admin';
import { passwordRecoverySchema } from './password-recovery-validation';
import { z } from 'zod';
import { PasswordRecoveryRequestsRepository, ActionsHistoryRepository } from '@/database/repositories/Repositories';
import { AuthService } from '@/services/auth/AuthService';
import { PasswordRecoveryService } from '@/services/password-recovery/PasswordRecoveryService';
import { SessionService } from '@/services/session/SessionService';

const authService = new AuthService();
const passwordRecoveryService = new PasswordRecoveryService();
const passwordRecoveryRequestsRepository = new PasswordRecoveryRequestsRepository();
const sessionService = new SessionService();
const actionsHistoryRepository = new ActionsHistoryRepository();

export const changePassword = async (
  { email, code, newPassword, newPasswordConfirmation }:
  { email: string, code: string, newPassword: string, newPasswordConfirmation: string }
) => {
    // Validation - keep in actions
    if(!(await authService.doesEmailExist(email))) {
      await actionsHistoryRepository.create({
        action: 'Falha na Alteração de Senha',
        details: `Tentativa de alterar senha com email inexistente: ${email}`,
        author: null,
        timestamp: new Date(),
        parameters: {
          email,
          code: 'redacted',
          password: 'redacted'
        }
      });

      return { success: false, error: "Email Doesn't Exist" };
    }

    const allowedRecovery = await passwordRecoveryRequestsRepository.findAllowedByEmail(email);

    if (!allowedRecovery) {
      await actionsHistoryRepository.create({
        action: 'Falha na Alteração de Senha',
        details: `Tentativa de alterar senha sem permissão: ${email}`,
        author: null,
        timestamp: new Date(),
        parameters: {
          email,
          code: 'redacted',
          password: 'redacted'
        }
      });

      return { success: false, error: "Password recovery not allowed for this email." };
    }

    if (allowedRecovery.code !== code) {
      await actionsHistoryRepository.create({
        action: 'Falha na Alteração de Senha',
        details: `Tentativa de alterar senha com código inválido: ${email}`,
        author: null,
        timestamp: new Date(),
        parameters: {
          email,
          code: 'redacted',
          password: 'redacted'
        }
      });

      return { success: false, error: "Invalid recovery code." };
    }

    try {
      await passwordRecoverySchema.parseAsync({ newPassword, newPasswordConfirmation, email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;

        await actionsHistoryRepository.create({
          action: 'Falha na Alteração de Senha',
          details: `Falha na validação ao alterar senha para ${email}.`,
          author: null,
          timestamp: new Date(),
          parameters: {
            email,
            code: 'redacted',
            password: 'redacted',
            validationErrors: fieldErrors
          }
        });

        return { success: false, error: fieldErrors || "Validation failed" };
      }
    }

    // Delegate business logic to service
    try {
      await passwordRecoveryService.changePassword(email, code, newPassword);

      await actionsHistoryRepository.create({
        action: 'Senha Alterada',
        details: `Senha alterada com sucesso para ${email}.`,
        author: null,
        timestamp: new Date(),
        parameters: {
          email
        }
      });

      return { success: true, error: "" };
    } catch (error) {
      await actionsHistoryRepository.create({
        action: 'Falha na Alteração de Senha',
        details: `Erro ao alterar senha para ${email}. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        author: null,
        timestamp: new Date(),
        parameters: {
          email,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });

      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

const generatePasswordRecoveryRequest = async (email: string) => {
  const passwordRecoveryRequest = await passwordRecoveryRequestsRepository.findByEmail(email);
  
  console.log(passwordRecoveryRequest);

  if (passwordRecoveryRequest) {
    await actionsHistoryRepository.create({
      action: 'Falha na Solicitação de Recuperação',
      details: `Tentativa de criar solicitação duplicada para ${email}.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        email
      }
    });

    return { success: false, error: "Password recovery request already exists for this email." };
  }
  
  try {
    await passwordRecoveryService.createPasswordRecoveryRequest(email);

    await actionsHistoryRepository.create({
      action: 'Solicitação de Recuperação Criada',
      details: `Solicitação de recuperação de senha criada para ${email}.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        email
      }
    });

    return { success: true, error: "" };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Solicitação de Recuperação',
      details: `Erro ao criar solicitação de recuperação para ${email}. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: null,
      timestamp: new Date(),
      parameters: {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export const denyPasswordRecoveryRequest = async (email: string) => {
  // Authentication & Authorization - keep in actions
  const session = await sessionService.getUserFromSession();
  
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Negar Recuperação',
      details: `Tentativa de negar recuperação de senha sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        email,
        authenticated: false
      }
    });

    return { success: false, error: "User Not Authenticated" };
  }

  if (session.role !== 'admin') {
    await actionsHistoryRepository.create({
      action: 'Falha ao Negar Recuperação',
      details: `Tentativa de negar recuperação de senha sem autorização.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        email,
        userRole: session.role
      }
    });

    return { success: false, error: "User Not Authorized" };
  }

  // Email validation - keep in actions
  if (!(await authService.doesEmailExist(email))) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Negar Recuperação',
      details: `Tentativa de negar recuperação com email inexistente: ${email}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        email
      }
    });

    return { success: false, error: "Email Doesn't Exist" };
  }

  const existingRequest = await passwordRecoveryRequestsRepository.findByEmail(email);

  if (!existingRequest) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Negar Recuperação',
      details: `Tentativa de negar recuperação sem solicitação ativa para ${email}.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        email
      }
    });

    return { success: false, error: "No active password recovery request found for this email." };
  }

  // Delegate business logic to service
  try {
    await passwordRecoveryService.denyPasswordRecoveryRequest(email);

    await actionsHistoryRepository.create({
      action: 'Recuperação Negada',
      details: `Recuperação de senha negada para ${email}.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        email
      }
    });

    return { success: true, error: "" };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Negar Recuperação',
      details: `Erro ao negar recuperação para ${email}. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export const allowPasswordRecovery = async (email: string) => {
  // Authentication & Authorization - keep in actions
  const session = await sessionService.getUserFromSession();
  
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Permitir Recuperação',
      details: `Tentativa de permitir recuperação de senha sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        email,
        authenticated: false
      }
    });

    return { success: false, error: "User Not Authenticated" };
  }

  if (session.role !== 'admin') {
    await actionsHistoryRepository.create({
      action: 'Falha ao Permitir Recuperação',
      details: `Tentativa de permitir recuperação de senha sem autorização.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        email,
        userRole: session.role
      }
    });

    return { success: false, error: "User Not Authorized" };
  }

  // Email validation - keep in actions
  if (!(await authService.doesEmailExist(email))) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Permitir Recuperação',
      details: `Tentativa de permitir recuperação com email inexistente: ${email}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        email
      }
    });

    return { success: false, error: "Email Doesn't Exist" };
  }

  const existingRequest = await passwordRecoveryRequestsRepository.findAllowedByEmail(email);

  if (existingRequest) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Permitir Recuperação',
      details: `Recuperação já permitida para ${email}.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        email
      }
    });

    return { success: false, error: "Password recovery already allowed for this email." };
  }

  // Delegate business logic to service
  try {
    const code = await passwordRecoveryService.allowPasswordRecovery(email);

    await actionsHistoryRepository.create({
      action: 'Recuperação Permitida',
      details: `Recuperação de senha permitida para ${email}.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        email,
        code: 'redacted'
      }
    });

    return { success: true, code, error: "" };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Permitir Recuperação',
      details: `Erro ao permitir recuperação para ${email}. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export const requestPasswordRecovery = async ({ email } : { email: string }) => {
  try {
    // Email validation - keep in actions
    if(!(await authService.doesEmailExist(email))) {
      await actionsHistoryRepository.create({
        action: 'Falha na Solicitação de Recuperação',
        details: `Tentativa de solicitar recuperação com email inexistente: ${email}`,
        author: null,
        timestamp: new Date(),
        parameters: {
          email
        }
      });

      return { success: false, error: "Email Doesn't Exist" };
    }
    
    // Delegate business logic to service
    return await generatePasswordRecoveryRequest(email);
  } catch (error) {
    if (error instanceof Error) {
      await actionsHistoryRepository.create({
        action: 'Falha na Solicitação de Recuperação',
        details: `Erro ao solicitar recuperação para ${email}. Erro: ${error.message}`,
        author: null,
        timestamp: new Date(),
        parameters: {
          email,
          error: error.message
        }
      });

      return { success: false, error: error.message };
    }
  }

  await actionsHistoryRepository.create({
    action: 'Falha na Solicitação de Recuperação',
    details: `Erro interno ao solicitar recuperação para ${email}.`,
    author: null,
    timestamp: new Date(),
    parameters: {
      email,
      error: "Internal Server Error"
    }
  });

  return { success: false, error: "Internal Server Error" };
}
