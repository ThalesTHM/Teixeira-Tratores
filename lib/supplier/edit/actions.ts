"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { SuppliersRepository, ActionsHistoryRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { supplierFormSchema } from "../create/validation";
import { z } from "zod";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const editSupplier = async (slug: string, data: any) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Fornecedor',
      details: `Tentativa de editar fornecedor sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        data,
        slug,
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated.' };
  }
  try {
    await supplierFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Fornecedor',
        details: `Falha na validação ao editar fornecedor "${data.name}".`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug,
          validationErrors: error.flatten().fieldErrors
        }
      });

      return { success: false, error: 'Invalid supplier data.' };
    }

    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Fornecedor',
      details: `Erro de validação ao editar fornecedor.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug,
        error: 'Validation error'
      }
    });

    return { success: false, error: 'Validation error.' };
  }
  try {
    const suppliersRepository = new SuppliersRepository();
    
    // Check for duplicates
    const allSuppliers = await suppliersRepository.findAll();
    const duplicateSupplier = allSuppliers.find(supplier => 
      supplier.name === data.name &&
      supplier.cnpj === data.cnpj &&
      supplier.address === data.address &&
      supplier.pnumber === data.pnumber &&
      supplier.slug !== slug
    );
    
    if (duplicateSupplier) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Fornecedor',
        details: `Tentativa de editar fornecedor com dados duplicados.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug
        }
      });

      return { success: false, error: 'A supplier with the same data already exists.' };
    }
    
    const currentData = await suppliersRepository.findBySlug(slug);
    
    if (!currentData) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Fornecedor',
        details: `Tentativa de editar fornecedor não encontrado.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug
        }
      });

      return { success: false, error: 'Supplier not found.' };
    }
    
    if (
      currentData.name === data.name &&
      currentData.cnpj === data.cnpj &&
      currentData.address === data.address &&
      currentData.pnumber === data.pnumber
    ) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Fornecedor',
        details: `Tentativa de editar fornecedor "${currentData.name}" sem alterações.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug
        }
      });

      return { success: false, error: 'No changes detected. Please modify at least one field.' };
    }
    
    await suppliersRepository.update(currentData.id, {
      name: data.name,
      cnpj: data.cnpj,
      address: data.address,
      pnumber: data.pnumber
    });

    await actionsHistoryRepository.create({
      action: 'Fornecedor Editado',
      details: `Fornecedor "${currentData.name}" foi editado.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug
      }
    });
    
    // Notification
    const name = currentData.name || "Fornecedor";
    const notification = {
      message: `Fornecedor "${name}" foi editado.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      slug: currentData.slug,
      priority: NotificationPriority.LOW,
      notificationSource: NotificationSource.SUPPLIER
    };
    const notificationRes = await NotificationsService.createNotification(notification);
    if (!notificationRes.success) {
      await actionsHistoryRepository.create({
        action: 'Falha ao Criar Notificação',
        details: `Erro ao criar notificação para edição de fornecedor "${name}". Erro: ${notificationRes.error}`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug,
          error: notificationRes.error
        }
      });

      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Fornecedor',
      details: `Erro ao editar fornecedor. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug,
        error: error instanceof Error ? error.message : 'Error editing the supplier'
      }
    });

    return { success: false, error: 'Error editing the supplier.' };
  }
};
