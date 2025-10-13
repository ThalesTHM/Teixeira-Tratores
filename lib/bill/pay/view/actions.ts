"use server";

import { getUserFromSession } from '@/lib/auth';
import { BillsToPayRepository } from '@/database/repositories/Repositories';

export const getBillsToPayBySlug = async (slug: string) => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const billsToPayRepository = new BillsToPayRepository();
    const bill = await billsToPayRepository.findBySlug(slug);

    if (!bill) {
      return { success: false, error: 'Bill not found' };
    }

    return { success: true, bill, error: '' };
  } catch (error) {
    return { success: false, error: 'Error retrieving the bill' };
  }
};

export const viewBillsToPay = async () => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const billsToPayRepository = new BillsToPayRepository();
    const bills = await billsToPayRepository.findAll();

    if (bills.length === 0) {
      return { success: true, data: null, error: '' };
    }

    return { success: true, bills, error: '' };
  } catch (error) {
    return { success: false, error: 'Error retrieving bills' };
  }
};