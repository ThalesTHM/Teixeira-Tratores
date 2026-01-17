"use server";

import { SessionService } from '@/services/session/SessionService';
import { ActionsHistoryRepository, BillsToPayRepository } from '@/database/repositories/Repositories';

const actionsHistoryRepository = new ActionsHistoryRepository();

export const getBillsToPayBySlug = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Conta a Pagar',
      details: `Tentativa de visualizar conta a pagar sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        slug,
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated' };
  }

  try {
    const billsToPayRepository = new BillsToPayRepository();
    const bill = await billsToPayRepository.findBySlug(slug);

    if (!bill) {
      await actionsHistoryRepository.create({
        action: 'Falha na Visualização de Conta a Pagar',
        details: `Tentativa de visualizar conta a pagar não encontrada.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          slug
        }
      });

      return { success: false, error: 'Bill not found' };
    }

    await actionsHistoryRepository.create({
      action: 'Conta a Pagar Visualizada',
      details: `Conta a pagar "${bill.name || 'Sem nome'}" foi visualizada.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        billId: bill.id,
        billName: bill.name
      }
    });

    return { success: true, bill, error: '' };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Conta a Pagar',
      details: `Erro ao visualizar conta a pagar. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return { success: false, error: 'Error retrieving the bill' };
  }
};

export const viewBillsToPay = async () => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Listagem de Contas a Pagar',
      details: `Tentativa de listar contas a pagar sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated' };
  }

  try {
    const billsToPayRepository = new BillsToPayRepository();
    const bills = await billsToPayRepository.findAll();

    await actionsHistoryRepository.create({
      action: 'Contas a Pagar Listadas',
      details: `Lista de contas a pagar foi visualizada (${bills.length} itens).`,
      author: session,
      timestamp: new Date(),
      parameters: {
        billsCount: bills.length
      }
    });

    if (bills.length === 0) {
      return { success: true, data: null, error: '' };
    }

    return { success: true, bills, error: '' };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Listagem de Contas a Pagar',
      details: `Erro ao listar contas a pagar. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return { success: false, error: 'Error retrieving bills' };
  }
};