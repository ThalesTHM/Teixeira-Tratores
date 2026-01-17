"use server";

import { SessionService } from "@/services/session/SessionService";
import { billsToPayFormSchema } from "./validation";
import { z } from "zod";
import { ActionsHistoryRepository, BillsToPayRepository } from "@/database/repositories/Repositories";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const editBillToPay = async (slug: string, data: any) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Conta a Pagar',
      details: `Tentativa de editar conta a pagar sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        data,
        slug,
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated' };
  }

  const billsToPayRepository = new BillsToPayRepository();
  let billDoc;

  try {
    billDoc = await billsToPayRepository.findBySlug(slug);

    if (!billDoc) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Conta a Pagar',
        details: `Tentativa de editar conta a pagar não encontrada.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          data,
          slug
        }
      });

      return { success: false, error: 'Bill not found' };
    }

    if (billDoc.name === data.name &&
      billDoc.price === data.price &&
      billDoc.expireDate === data.expireDate &&
      billDoc.paymentMethod === data.paymentMethod &&
      billDoc.paymentStatus === data.paymentStatus &&
      billDoc.supplier === data.supplier &&
      billDoc.description === data.description
    ) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Conta a Pagar',
        details: `Tentativa de editar conta a pagar "${billDoc.name}" com dados idênticos.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug
        }
      });

      return { success: false, error: 'A bill with the same data already exists' };
    }
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Conta a Pagar',
      details: `Erro ao verificar dados da conta a pagar. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return { success: false, error: 'Error checking existing bill data' };
  }

  try {
    await billsToPayFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Conta a Pagar',
        details: `Falha na validação ao editar conta a pagar "${data.name}".`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug,
          validationErrors: error.flatten().fieldErrors
        }
      });

      return { success: false, error: 'Invalid bill data' };
    }

    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Conta a Pagar',
      details: `Erro de validação ao editar conta a pagar.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug
      }
    });

    return { success: false, error: 'Validation error' };
  }

  try {
    const updateData = {
      name: data.name,
      price: data.price,
      expireDate: data.expireDate,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      supplier: data.supplier,
      description: data.description
    };

    await billsToPayRepository.update(billDoc.id, updateData);

    await actionsHistoryRepository.create({
      action: 'Conta a Pagar Editada',
      details: `Conta a pagar "${data.name}" foi editada.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...updateData,
        slug
      }
    });

    const name = billDoc.name || "Conta a Pagar";

    const notification = {
      message: `Conta a Pagar "${name}" Foi Editada.`,
      role: NotificationRole.MANAGER,
      slug: slug,
      createdBy: session.name,
      priority: NotificationPriority.LOW,
      notificationSource: NotificationSource.BILL_TO_PAY
    };

    const notificationRes = await NotificationsService.createNotification(notification);

    if (!notificationRes.success) {
      await actionsHistoryRepository.create({
        action: 'Falha ao Criar Notificação',
        details: `Erro ao criar notificação para edição de conta a pagar "${data.name}". Erro: ${notificationRes.error}`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...updateData,
          slug,
          error: notificationRes.error
        }
      });

      return { success: false, error: 'Error creating notification' };
    }

    return { success: true, error: '' };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Conta a Pagar',
      details: `Erro ao editar conta a pagar "${data.name}". Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return { success: false, error: 'Error editing the bill' };
  }
};
