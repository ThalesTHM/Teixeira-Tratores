"use server";

import { SessionService } from "@/services/session/SessionService";
import { ActionsHistoryRepository, ClientsRepository } from "@/database/repositories/Repositories";

const actionsHistoryRepository = new ActionsHistoryRepository();

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
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();
    if (!session) {
        await actionsHistoryRepository.create({
            action: 'Falha na Listagem de Clientes',
            details: `Tentativa de listar clientes sem autenticação.`,
            author: null,
            timestamp: new Date(),
            parameters: {
                authenticated: false
            }
        });

        return {
            success: false,
            error: "User Not Authenticated",
            clients: []
        };
    }
    try {
        const clientsRepository = new ClientsRepository();
        const clients = await clientsRepository.findAll();

        await actionsHistoryRepository.create({
            action: 'Clientes Listados',
            details: `Lista de clientes foi visualizada (${clients.length} itens).`,
            author: session,
            timestamp: new Date(),
            parameters: {
                clientsCount: clients.length
            }
        });

        return {
            success: true,
            clients,
            error: ""
        };
    } catch (error) {
        await actionsHistoryRepository.create({
            action: 'Falha na Listagem de Clientes',
            details: `Erro ao listar clientes. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                error: error instanceof Error ? error.message : "Erro desconhecido"
            }
        });

        return {
            success: false,
            clients: [],
            error: "Error fetching clients"
        };
    }
};

// Get a client by slug
export const getClientBySlug = async (slug: string) => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();

    if (!session) {
        await actionsHistoryRepository.create({
            action: 'Falha na Visualização de Cliente',
            details: `Tentativa de visualizar cliente sem autenticação.`,
            author: null,
            timestamp: new Date(),
            parameters: {
                slug,
                authenticated: false
            }
        });

        return {
            success: false,
            error: 'User not authenticated',
            client: null
        };
    }

    try {
        const clientsRepository = new ClientsRepository();
        const client = await clientsRepository.findBySlug(slug);
        if (!client) {
            await actionsHistoryRepository.create({
                action: 'Falha na Visualização de Cliente',
                details: `Tentativa de visualizar cliente não encontrado.`,
                author: session,
                timestamp: new Date(),
                parameters: {
                    slug
                }
            });

            return {
                success: false,
                error: 'Cliente não encontrado.',
                client: null
            };
        }

        await actionsHistoryRepository.create({
            action: 'Cliente Visualizado',
            details: `Cliente "${client.name || 'Sem nome'}" foi visualizado.`,
            author: session,
            timestamp: new Date(),
            parameters: {
                slug,
                clientId: client.id,
                clientName: client.name
            }
        });

        return {
            success: true,
            client,
            error: ''
        };
    } catch (error) {
        await actionsHistoryRepository.create({
            action: 'Falha na Visualização de Cliente',
            details: `Erro ao buscar cliente. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                slug,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            }
        });

        return {
            success: false,
            error: 'Erro ao buscar cliente.',
            client: null
        };
    }
};

export const getClientById = async (id: string): Promise<{ success: boolean; error: string; client: Client | null }> => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();
    if (!session) {
        await actionsHistoryRepository.create({
            action: 'Falha na Visualização de Cliente por ID',
            details: `Tentativa de visualizar cliente por ID sem autenticação.`,
            author: null,
            timestamp: new Date(),
            parameters: {
                id,
                authenticated: false
            }
        });

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
            await actionsHistoryRepository.create({
                action: 'Falha na Visualização de Cliente por ID',
                details: `Tentativa de visualizar cliente não encontrado por ID.`,
                author: session,
                timestamp: new Date(),
                parameters: {
                    id
                }
            });

            return {
                success: false,
                error: "Client not found",
                client: null
            };
        }

        await actionsHistoryRepository.create({
            action: 'Cliente Visualizado por ID',
            details: `Cliente "${client.name || 'Sem nome'}" foi visualizado por ID.`,
            author: session,
            timestamp: new Date(),
            parameters: {
                id,
                clientId: client.id,
                clientName: client.name
            }
        });

        return {
            success: true,
            client,
            error: ""
        };
    } catch (error) {
        await actionsHistoryRepository.create({
            action: 'Falha na Visualização de Cliente por ID',
            details: `Erro ao buscar cliente por ID. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            author: session,
            timestamp: new Date(),
            parameters: {
                id,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            }
        });

        return {
            success: false,
            client: null,
            error: "Error fetching client by id"
        };
    }
};
