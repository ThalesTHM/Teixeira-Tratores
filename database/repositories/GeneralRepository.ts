import { adminFirestore } from "@/firebase/firebase-admin";
import { RepositoryHistoryService } from "@/services/repository-history/RepositoryHistoryService";

export class Repository {
    private historyService: RepositoryHistoryService = new RepositoryHistoryService();

    constructor(
        private collectionName: string,
    ) {}

    getCollectionName(): string {
        return this.collectionName;
    }

    // Convert Firestore Timestamps to JavaScript Date objects
    private convertTimestamps(data: any): any {
        if (!data || typeof data !== 'object') return data;
        
        const converted = { ...data };
        
        // Check common timestamp fields
        const timestampFields = ['createdAt', 'updatedAt', 'deletedAt', 'readAt', 'softReadAt'];
        
        for (const field of timestampFields) {
            if (converted[field]) {
                if (typeof converted[field] === 'object') {
                    // Check if it has toDate method (Firestore Timestamp)
                    if (converted[field].toDate && typeof converted[field].toDate === 'function') {
                        converted[field] = converted[field].toDate();
                    }
                    // Check if it has _seconds and _nanoseconds (Firestore Timestamp structure)
                    else if ('_seconds' in converted[field] && '_nanoseconds' in converted[field]) {
                        const seconds = typeof converted[field]._seconds === 'number' ? converted[field]._seconds : 0;
                        const nanoseconds = typeof converted[field]._nanoseconds === 'number' ? converted[field]._nanoseconds : 0;
                        converted[field] = new Date(seconds * 1000 + nanoseconds / 1000000);
                    }
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
            const result = { id: docRef.id, ...createdData };
            
            await this.historyService.createCreateRecord(docRef.id, createdData, this.collectionName);

            return result;
        } catch (error) {
            await this.historyService.createErrorReportRecord(null, {
                method: 'create',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                data
            }, this.collectionName);
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
            await this.historyService.createErrorReportRecord(id, {
                method: 'findById',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                id
            }, this.collectionName);
            throw new Error('Error finding record: ' + error);
        }
    }

    async update(id: string, data: any): Promise<any> {
        let historyRecordId: string | null = null;
        
        try {
            const historyRecord = await this.historyService.createUpdateRecord(id, data, this);
            historyRecordId = historyRecord?.id;
            
            const updateData = {
                ...data,
                updatedAt: new Date()
            };
 
            await adminFirestore.collection(this.collectionName).doc(id).update(updateData);
            
            return { id, ...updateData };
        } catch (error) {
            // Rollback history if it was created
            if (historyRecordId) {
                await this.historyService.rollbackRecord(historyRecordId);
            }
            await this.historyService.createErrorReportRecord(id, {
                method: 'update',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                id,
                data
            }, this.collectionName);
            throw new Error('Error updating record: ' + error);
        }
    }

    async delete(id: string): Promise<void> {
        let historyRecordId: string | null = null;
        const deletionTime = new Date();
        
        try {
            const historyRecord = await this.historyService.createSoftDeleteRecord(id, this, deletionTime);
            historyRecordId = historyRecord?.id;
            
            // Soft delete: set deletedAt timestamp instead of actually deleting
            await adminFirestore.collection(this.collectionName).doc(id).update({
                deletedAt: deletionTime,
                updatedAt: deletionTime
            });

        } catch (error) {
            // Rollback history if it was created
            if (historyRecordId) {
                await this.historyService.rollbackRecord(historyRecordId);
            }
            await this.historyService.createErrorReportRecord(id, {
                method: 'delete',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                id
            }, this.collectionName);
            throw new Error('Error deleting record: ' + error);
        }
    }

    async hardDelete(id: string): Promise<void> {
        let historyRecordId: string | null = null;
        
        try {
            // Create history record BEFORE deletion so we can still fetch the data
            const historyRecord = await this.historyService.createHardDeleteRecord(id, this);
            historyRecordId = historyRecord?.id;
            
            // Actual deletion from database
            await adminFirestore.collection(this.collectionName).doc(id).delete();
        } catch (error) {
            // Rollback history if it was created
            if (historyRecordId) {
                await this.historyService.rollbackRecord(historyRecordId);
            }
            await this.historyService.createErrorReportRecord(id, {
                method: 'hardDelete',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                id
            }, this.collectionName);
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
            await this.historyService.createErrorReportRecord(null, {
                method: 'findAll',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error)
            }, this.collectionName);
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
            await this.historyService.createErrorReportRecord(null, {
                method: 'findBySlug',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                slug
            }, this.collectionName);
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
            await this.historyService.createErrorReportRecord(null, {
                method: 'findByField',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                field,
                value
            }, this.collectionName);
            throw new Error('Error finding records by field: ' + error);
        }
    }

    async restore(id: string): Promise<any> {
        let historyRecordId: string | null = null;
        
        try {
            const historyRecord = await this.historyService.createRestoreRecord(id, this);
            historyRecordId = historyRecord?.id;
            
            const updateData = {
                deletedAt: null,
                updatedAt: new Date()
            };
            await adminFirestore.collection(this.collectionName).doc(id).update(updateData);

            return { id, ...updateData };
        } catch (error) {
            // Rollback history if it was created
            if (historyRecordId) {
                await this.historyService.rollbackRecord(historyRecordId);
            }
            await this.historyService.createErrorReportRecord(id, {
                method: 'restore',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                id
            }, this.collectionName);
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
            await this.historyService.createErrorReportRecord(null, {
                method: 'findDeleted',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error)
            }, this.collectionName);
            throw new Error('Error retrieving deleted records: ' + error);
        }
    }

    async findByIdDeleted(id: string): Promise<any | null> {
        try {
            const doc = await adminFirestore.collection(this.collectionName).doc(id).get();  
            if (doc.exists) {
                const data = doc.data();
                // Only return if soft deleted (deletedAt exists and is not null)
                if (data && data.deletedAt !== null && data.deletedAt !== undefined) {
                    return { id: doc.id, ...data };
                }
            }
            return null;
        } catch (error) {
            await this.historyService.createErrorReportRecord(id, {
                method: 'findByIdDeleted',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                id
            }, this.collectionName);
            throw new Error('Error finding deleted record: ' + error);
        }
    }

    async bulkFindByIds(ids: string[]): Promise<Map<string, any>> {
        try {
            const docRefs = ids.map(id => adminFirestore.collection(this.collectionName).doc(id));
            const docs = await adminFirestore.getAll(...docRefs);
            const result = new Map<string, any>();
            for (const doc of docs) {
                if (doc.exists) {
                    result.set(doc.id, this.convertTimestamps({ id: doc.id, ...doc.data() }));
                }
            }
            return result;
        } catch (error) {
            throw new Error('Error bulk finding records by ids: ' + error);
        }
    }

    async bulkDelete(ids: string[]): Promise<void> {
        const bulkWriter = adminFirestore.bulkWriter();
        const deletionTime = new Date();
        const historyRecordIds: string[] = [];
        
        try {
            for (const id of ids) {
                const docRef = adminFirestore.collection(this.collectionName).doc(id);
                bulkWriter.update(docRef, {
                    deletedAt: deletionTime,
                    updatedAt: deletionTime
                });
            }
            
            await bulkWriter.close();
        } catch (error) {
            // Rollback all history records
            for (const historyId of historyRecordIds) {
                await this.historyService.rollbackRecord(historyId);
            }
            await this.historyService.createErrorReportRecord(null, {
                method: 'bulkDelete',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                ids
            }, this.collectionName);
            throw new Error('Error bulk deleting records: ' + error);
        }
    }

    async bulkUpdate(updates: Array<{ id: string; data: any }>): Promise<any[]> {
        let historyRecordIds: string[] = [];

        try {
            const historyRecords = await this.historyService.bulkUpdateRecords(
                this.collectionName,
                this,
                updates.map(({ id, data }) => ({ recordId: id, updatedData: data }))
            );
            historyRecordIds = (historyRecords ?? []).map((r: any) => r.id).filter(Boolean);

            const bulkWriter = adminFirestore.bulkWriter();
            const now = new Date();
            const updatedItems: any[] = [];

            for (const { id, data } of updates) {
                const docRef = adminFirestore.collection(this.collectionName).doc(id);
                const updateData = { ...data, updatedAt: now };
                bulkWriter.update(docRef, updateData);
                updatedItems.push({ id, ...updateData });
            }

            await bulkWriter.close();
            return updatedItems;
        } catch (error) {
            for (const historyId of historyRecordIds) {
                await this.historyService.rollbackRecord(historyId);
            }
            await this.historyService.createErrorReportRecord(null, {
                method: 'bulkUpdate',
                collection: this.collectionName,
                error: error instanceof Error ? error.message : String(error),
                ids: updates.map(u => u.id),
            }, this.collectionName);
            throw new Error('Error bulk updating records: ' + error);
        }
    }

}