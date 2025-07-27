"use server";

import { getUserFromSession } from "@/lib/auth";
import { adminFirestore } from "@/firebase/firebase-admin";

type Client = {
    id: string;
    name: string;
    cnpj: string;
    address: string;
    pnumber: string;
    slug: string;
    createdAt?: number;
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
        const clientsSnapshot = await adminFirestore.collection('clients').get();
        const clients: Client[] = clientsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data?.name ?? '',
                cnpj: data?.cnpj ?? '',
                address: data?.address ?? '',
                pnumber: data?.pnumber ?? '',
                slug: data?.slug ?? '',
                createdAt: data?.createdAt,
                updatedAt: data?.updatedAt,
            };
        });
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
        const clientsCollection = adminFirestore.collection('clients');
        const querySnapshot = await clientsCollection.where('slug', '==', slug).limit(1).get();
        if (querySnapshot.empty) {
            return {
                success: false,
                error: 'Cliente não encontrado.',
                client: null
            };
        }
        const doc = querySnapshot.docs[0];
        return {
            success: true,
            client: { id: doc.id, ...doc.data() },
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
        const clientDoc = await adminFirestore.collection('clients').doc(id).get();
        if (!clientDoc.exists) {
            return {
                success: false,
                error: "Client not found",
                client: null
            };
        }
        const data = clientDoc.data();
        const client: Client = {
            id: clientDoc.id,
            name: data?.name ?? '',
            cnpj: data?.cnpj ?? '',
            address: data?.address ?? '',
            pnumber: data?.pnumber ?? '',
            slug: data?.slug ?? '',
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
        };
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
