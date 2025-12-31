"use server";

import { ClientsRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { clientFormSchema } from "./validation";
import { z } from "zod";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

export const editClient = async (slug: string, data: any) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  
  if (!session) {
    return { success: false, error: 'User not authenticated.' };
  }
  // Validate with zod
  try {
    await clientFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid client data.' };
    }

    return { success: false, error: 'Validation error.' };
  }
  try {
    const clientsRepository = new ClientsRepository();

    // Check for duplicates
    const allClients = await clientsRepository.findAll();
    const duplicateClient = allClients.find(client => 
      client.name === data.name && 
      client.cpf === data.cpf && 
      client.address === data.address && 
      client.pnumber === data.pnumber &&
      client.slug !== slug
    );

    if (duplicateClient) {
      return { success: false, error: 'A client with the same data already exists.' };
    }

    const clientData = await clientsRepository.findBySlug(slug);

    if (!clientData) {
      return { success: false, error: 'Client not found.' };
    }

    await clientsRepository.update(clientData.id, {
      name: data.name,
      cpf: data.cpf,
      address: data.address,
      pnumber: data.pnumber
    });

    // Notification
    const name = clientData.name || "Cliente";
    const notification = {
      message: `Cliente "${name}" foi editado.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      slug: clientData.slug,
      priority: NotificationPriority.LOW,
      notificationSource: NotificationSource.CLIENT
    };
    const notificationRes = await NotificationsService.createNotification(notification);
    if (!notificationRes.success) {
      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error editing the client.' };
  }
};
