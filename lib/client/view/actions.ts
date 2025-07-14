"use server";

import { getUserFromSession } from "@/lib/auth";
import { adminFirestore } from "@/firebase/firebase-admin";

// Function to view all client attributes if user is logged in
export const viewClients = async () => {
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
        const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
