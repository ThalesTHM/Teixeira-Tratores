"use server";

import { getUserFromSession } from "@/lib/auth";
import { ClientsRepository } from "@/database/repositories/Repositories";

type Client = {
    id: string;
    name: string;
    cnpj: string;
    address: string;
    pnumber: string;
    slug: string;
    createdAt?: Date;
    updatedAt?: number;
};

export const viewClients = async (): Promise<{ success: boolean; error: string; clients: Client[] }> => {
    const session = await getUserFromSession();
    if (!session) {
        return {
            success: false,
            error: "User Not Authenticated",
            clients: []
        };
    }
    try {
        const clientsRepository = new ClientsRepository();
        const clients = await clientsRepository.findAll();
        return {
            success: true,
            clients,
            error: ""
        };
    } catch (error) {
        return {
            success: false,
            clients: [],
            error: "Error fetching clients"
        };
    }
};

// Get a client by slug
export const getClientBySlug = async (slug: string) => {
    try {
        const clientsRepository = new ClientsRepository();
        const client = await clientsRepository.findBySlug(slug);
        if (!client) {
            return {
                success: false,
                error: 'Cliente não encontrado.',
                client: null
            };
        }
        return {
            success: true,
            client,
            error: ''
        };
    } catch (error) {
        return {
            success: false,
            error: 'Erro ao buscar cliente.',
            client: null
        };
    }
};

export const getClientById = async (id: string): Promise<{ success: boolean; error: string; client: Client | null }> => {
    const session = await getUserFromSession();
    if (!session) {
        return {
            success: false,
            error: "User Not Authenticated",
            client: null
        };
    }
    try {
        const clientsRepository = new ClientsRepository();
        const client = await clientsRepository.findById(id);
        if (!client) {
            return {
                success: false,
                error: "Client not found",
                client: null
            };
        }
        return {
            success: true,
            client,
            error: ""
        };
    } catch (error) {
        return {
            success: false,
            client: null,
            error: "Error fetching client by id"
        };
    }
};
