import { adminFirestore } from "@/firebase/firebase-admin";

export class Repository {
    constructor(private collectionName: string) {}

    // Convert Firestore Timestamps to JavaScript Date objects
    private convertTimestamps(data: any): any {
        if (!data || typeof data !== 'object') return data;
        
        const converted = { ...data };
        
        // Check common timestamp fields
        const timestampFields = ['createdAt', 'updatedAt', 'deletedAt', 'readAt', 'softReadAt'];
        
        for (const field of timestampFields) {
            if (converted[field]) {
                if (typeof converted[field] === 'object' && converted[field].toDate) {
                    // Convert Firestore Timestamp to JavaScript Date
                    converted[field] = converted[field].toDate();
                } else if (typeof converted[field] === 'number') {
                    // Convert milliseconds to Date
                    converted[field] = new Date(converted[field]);
                } else if (typeof converted[field] === 'string') {
                    // Convert string to Date
                    converted[field] = new Date(converted[field]);
                }
                // If it's already a Date object, leave it as is
            }
        }
        
        return converted;
    }

    async create(data: any): Promise<any> {
        try {
            const now = new Date();
            const createdData = { 
                ...data, 
                createdAt: now,
                updatedAt: null,
                deletedAt: null
            };

            const docRef = await adminFirestore.collection(this.collectionName).add(createdData);
            return { id: docRef.id, ...createdData };
        } catch (error) {
            throw new Error('Error creating record: ' + error);
        }
    }

    // Subscribe to all non-deleted documents
    subscribeToAll(callback: (data: any[]) => void): () => void {
        const unsubscribe = adminFirestore.collection(this.collectionName)
            .onSnapshot(snapshot => {
                const data = snapshot.docs
                    .map(doc => this.convertTimestamps({ id: doc.id, ...doc.data() }))
                    .filter((doc: any) => doc.deletedAt === null || doc.deletedAt === undefined);
                callback(data);
            });
        return unsubscribe;
    }

    // Subscribe to a specific document by slug
    subscribeBySlug(slug: string, callback: (data: any | null) => void): () => void {
        const unsubscribe = adminFirestore.collection(this.collectionName)
            .where('slug', '==', slug)
            .onSnapshot(snapshot => {
                const validDocs = snapshot.docs
                    .map(doc => this.convertTimestamps({ id: doc.id, ...doc.data() }))
                    .filter((doc: any) => doc.deletedAt === null || doc.deletedAt === undefined);
                
                callback(validDocs.length > 0 ? validDocs[0] : null);
            });
        return unsubscribe;
    }

    // Subscribe with custom filter and sort
    subscribeWithFilter(
        whereConditions: Array<{ field: string; operator: any; value: any }>,
        orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>,
        callback?: (data: any[]) => void
    ): () => void {
        let query: any = adminFirestore.collection(this.collectionName);
        
        // Apply where conditions
        whereConditions.forEach(condition => {
            query = query.where(condition.field, condition.operator, condition.value);
        });
        
        // Apply ordering
        if (orderBy) {
            orderBy.forEach(order => {
                query = query.orderBy(order.field, order.direction);
            });
        }
        
        const unsubscribe = query.onSnapshot((snapshot: any) => {
            const data = snapshot.docs
                .map((doc: any) => this.convertTimestamps({ id: doc.id, ...doc.data() }))
                .filter((doc: any) => doc.deletedAt === null || doc.deletedAt === undefined);
            if (callback) callback(data);
        });
        
        return unsubscribe;
    }

    async findById(id: string): Promise<any | null> {
        try {
            const doc = await adminFirestore.collection(this.collectionName).doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                // Only return if not soft deleted (deletedAt is null or doesn't exist)
                if (data && (data.deletedAt === null || data.deletedAt === undefined)) {
                    return this.convertTimestamps({ id: doc.id, ...data });
                }
            }
            return null;
        } catch (error) {
            throw new Error('Error finding record: ' + error);
        }
    }

    async update(id: string, data: any): Promise<any> {
        try {
            const updateData = {
                ...data,
                updatedAt: new Date()
            };
            await adminFirestore.collection(this.collectionName).doc(id).update(updateData);
            return { id, ...updateData };
        } catch (error) {
            throw new Error('Error updating record: ' + error);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            // Soft delete: set deletedAt timestamp instead of actually deleting
            await adminFirestore.collection(this.collectionName).doc(id).update({
                deletedAt: new Date(),
                updatedAt: new Date()
            });
        } catch (error) {
            throw new Error('Error deleting record: ' + error);
        }
    }

    async hardDelete(id: string): Promise<void> {
        try {
            // Actual deletion from database
            await adminFirestore.collection(this.collectionName).doc(id).delete();
        } catch (error) {
            throw new Error('Error hard deleting record: ' + error);
        }
    }

    async findAll(): Promise<any[]> {
        try {
            // Get all documents and filter out soft deleted ones
            const snapshot = await adminFirestore.collection(this.collectionName).get();
            return snapshot.docs
                .map(doc => this.convertTimestamps({ id: doc.id, ...doc.data() }))
                .filter((doc: any) => doc.deletedAt === null || doc.deletedAt === undefined);
        } catch (error) {
            throw new Error('Error retrieving records: ' + error);
        }
    }

    async findBySlug(slug: string): Promise<any | null> {
        try {
            // Get all documents with matching slug and filter out soft deleted ones
            const snapshot = await adminFirestore.collection(this.collectionName)
                .where('slug', '==', slug)
                .get();
            
            const validDocs = snapshot.docs
                .map(doc => this.convertTimestamps({ id: doc.id, ...doc.data() }))
                .filter((doc: any) => doc.deletedAt === null || doc.deletedAt === undefined);
                
            if (validDocs.length > 0) {
                return validDocs[0];
            }
            return null;
        } catch (error) {
            throw new Error('Error finding record by slug: ' + error);
        }
    }

    async findByField(field: string, value: any): Promise<any[]> {
        try {
            // Get all documents with matching field and filter out soft deleted ones
            const snapshot = await adminFirestore.collection(this.collectionName)
                .where(field, '==', value)
                .get();
            return snapshot.docs
                .map(doc => this.convertTimestamps({ id: doc.id, ...doc.data() }))
                .filter((doc: any) => doc.deletedAt === null || doc.deletedAt === undefined);
        } catch (error) {
            throw new Error('Error finding records by field: ' + error);
        }
    }

    async restore(id: string): Promise<any> {
        try {
            const updateData = {
                deletedAt: null,
                updatedAt: new Date()
            };
            await adminFirestore.collection(this.collectionName).doc(id).update(updateData);
            return { id, ...updateData };
        } catch (error) {
            throw new Error('Error restoring record: ' + error);
        }
    }

    async findDeleted(): Promise<any[]> {
        try {
            // Get all documents and filter to show only soft deleted ones
            const snapshot = await adminFirestore.collection(this.collectionName).get();
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((doc: any) => doc.deletedAt !== null && doc.deletedAt !== undefined);
        } catch (error) {
            throw new Error('Error retrieving deleted records: ' + error);
        }
    }
}