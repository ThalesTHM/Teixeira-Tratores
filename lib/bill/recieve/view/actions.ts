"use server";

import { BillsToReceiveRepository } from "@/database/repositories/Repositories";

export const viewBillsToReceive = async () => {
  try {
    const billsToReceiveRepository = new BillsToReceiveRepository();
    const bills = await billsToReceiveRepository.findAll();
    return { success: true, bills };
  } catch (error) {
    return { success: false, error: "Erro ao buscar contas a receber." };
  }
};

export const getBillToReceiveBySlug = async (slug: string) => {
  try {
    const billsToReceiveRepository = new BillsToReceiveRepository();
    const bill = await billsToReceiveRepository.findBySlug(slug);
    if (!bill) return { success: false, error: "Conta a receber não encontrada." };
    return { success: true, data: bill };
  } catch (error) {
    return { success: false, error: "Erro ao buscar conta a receber." };
  }
};
