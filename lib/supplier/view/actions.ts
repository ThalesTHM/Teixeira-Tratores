"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { SessionService } from "@/services/session/SessionService";
import { ActionsHistoryRepository } from "@/database/repositories/Repositories";

const actionsHistoryRepository = new ActionsHistoryRepository();

type Supplier = {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  pnumber: string;
  description: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: number;
};

export const viewSuppliers = async (): Promise<{ success: boolean; error: string; suppliers: Supplier[] }> => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Fornecedores',
      details: `Tentativa de visualizar fornecedores sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated', suppliers: [] };
  }

  try {
    const suppliersSnapshot = await adminFirestore.collection('suppliers').get();
    const suppliers: Supplier[] = suppliersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? '',
        cnpj: data.cnpj ?? '',
        address: data.address ?? '',
        pnumber: data.pnumber ?? '',
        description: data.description ?? '',
        slug: data.slug ?? '',
        ...data,
      };
    });

    await actionsHistoryRepository.create({
      action: 'Fornecedores Visualizados',
      details: `Fornecedores foram visualizados.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        suppliersCount: suppliers.length
      }
    });

    return {
      success: true,
      suppliers,
      error: ""
    };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Fornecedores',
      details: `Erro ao buscar fornecedores. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        error: error instanceof Error ? error.message : 'Error fetching suppliers'
      }
    });

    return {
      success: false,
      suppliers: [],
      error: "Error fetching suppliers"
    };
  }
};

export const getSupplierBySlug = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Fornecedor',
      details: `Tentativa de visualizar fornecedor sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        slug,
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated', supplier: null };
  }

  try {
    const suppliersCollection = adminFirestore.collection('suppliers');
    const snapshot = await suppliersCollection.where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) {
      await actionsHistoryRepository.create({
        action: 'Falha na Visualização de Fornecedor',
        details: `Tentativa de visualizar fornecedor não encontrado.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          slug
        }
      });

      return { success: false, error: 'Supplier not found.', supplier: null };
    }

    const supplier = snapshot.docs[0].data();

    await actionsHistoryRepository.create({
      action: 'Fornecedor Visualizado',
      details: `Fornecedor "${supplier.name}" foi visualizado.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        supplierName: supplier.name
      }
    });

    return { success: true, error: '', supplier };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Fornecedor',
      details: `Erro ao buscar fornecedor. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        error: error instanceof Error ? error.message : 'Error fetching supplier'
      }
    });

    return { success: false, error: 'Error fetching supplier.', supplier: null };
  }
};

export const getSupplierById = async (supplierId: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Fornecedor',
      details: `Tentativa de visualizar fornecedor por ID sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        supplierId,
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated' };
  }

  try {
    const supplierDoc = await adminFirestore.collection('suppliers').doc(supplierId).get();
    if (!supplierDoc.exists) {
      await actionsHistoryRepository.create({
        action: 'Falha na Visualização de Fornecedor',
        details: `Tentativa de visualizar fornecedor não encontrado por ID.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          supplierId
        }
      });

      return { success: false, error: 'Supplier not found' };
    }

    const supplier = supplierDoc.data();

    await actionsHistoryRepository.create({
      action: 'Fornecedor Visualizado',
      details: `Fornecedor "${supplier?.name}" foi visualizado por ID.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        supplierId,
        supplierName: supplier?.name
      }
    });

    return { success: true, supplier, error: '' };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Fornecedor',
      details: `Erro ao buscar fornecedor por ID. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        supplierId,
        error: error instanceof Error ? error.message : 'Error fetching supplier'
      }
    });

    return { success: false, error: 'Error fetching supplier' };
  }
};