import { adminAuth, adminFirestore } from "@/firebase/firebase-admin";

export const checkIfEmailIsAlreadyInUse = async (email: string) => {                        
    try{
        return (await adminAuth.getUserByEmail(email));
    } catch (error) {
        return null;
    }
}

export const removeUsedInvite = async (email: string) => {
    try {
        const collection = await adminFirestore.collection('emailInvites');
        
        const snapshot = await collection
            .where("email", "==", email)
            .where("used", "==", true)
            .get();

        const doc = snapshot.docs[0].ref;

        await doc.delete();
    
        return { success: true, error: '' }
    } catch (error) {
        if(error instanceof Error){
            return { success: true, error: error.message }
        }
    }

    return { success: false, error: 'Internal Error' }
}