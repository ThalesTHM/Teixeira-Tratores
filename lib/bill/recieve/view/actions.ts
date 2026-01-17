"use server";

import { ActionsHistoryRepository, BillsToReceiveRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const viewBillsToReceive = async () => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Listagem de Contas a Receber',
      details: `Tentativa de listar contas a receber sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        authenticated: false
      }
    });

    return { success: false, error: "User not authenticated" };
  }

  try {
    const billsToReceiveRepository = new BillsToReceiveRepository();
    const bills = await billsToReceiveRepository.findAll();

    await actionsHistoryRepository.create({
      action: 'Contas a Receber Listadas',
      details: `Lista de contas a receber foi visualizada (${bills.length} itens).`,
      author: session,
      timestamp: new Date(),
      parameters: {
        billsCount: bills.length
      }
    });

    return { success: true, bills };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Listagem de Contas a Receber',
      details: `Erro ao listar contas a receber. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return { success: false, error: "Erro ao buscar contas a receber." };
  }
};

export const getBillToReceiveBySlug = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Conta a Receber',
      details: `Tentativa de visualizar conta a receber sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        slug,
        authenticated: false
      }
    });

    return { success: false, error: "User not authenticated" };
  }

  try {
    const billsToReceiveRepository = new BillsToReceiveRepository();
    const bill = await billsToReceiveRepository.findBySlug(slug);

    if (!bill) {
      await actionsHistoryRepository.create({
        action: 'Falha na Visualização de Conta a Receber',
        details: `Tentativa de visualizar conta a receber não encontrada.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          slug
        }
      });

      return { success: false, error: "Conta a receber não encontrada." };
    }

    await actionsHistoryRepository.create({
      action: 'Conta a Receber Visualizada',
      details: `Conta a receber "${bill.name || 'Sem nome'}" foi visualizada.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        billId: bill.id,
        billName: bill.name
      }
    });

    return { success: true, data: bill };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Conta a Receber',
      details: `Erro ao visualizar conta a receber. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return { success: false, error: "Erro ao buscar conta a receber." };
  }
};
