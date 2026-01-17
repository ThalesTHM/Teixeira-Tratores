import { RepositoryHistoryRepository } from "@/database/repositories/HistoryRepository";
import { SessionService } from "../session/SessionService";
import { Repository } from "@/database/repositories/GeneralRepository";

export class RepositoryHistoryService {
    private _sessionService: SessionService | null = null;
    private repositoryHistoryRepository: RepositoryHistoryRepository = new RepositoryHistoryRepository();
    private isLoggingEnabled: boolean;

    constructor() {
        this.isLoggingEnabled = process.env.NEXT_PUBLIC_ENABLE_REPOSITORY_HISTORY_LOGGING !== 'false';
    }

    private getSessionService(): SessionService {
        if (!this._sessionService) {
            this._sessionService = new SessionService();
        }
        return this._sessionService;
    }

    async createCreateRecord(recordId: string, data: any, collectionName?: string): Promise<any> {
        // Skip logging if disabled or if it's actionsHistory collection
        if (!this.isLoggingEnabled || collectionName === 'actionsHistory') {
            return null;
        }

        const session = await this.getSessionService().getUserFromSession();

        return this.repositoryHistoryRepository.create({
            recordId: recordId,
            action: 'create',
            source: collectionName,
            author: session,
            timestamp: new Date(),
            before: null,
            after: data,
        });
    }

    async createHardDeleteRecord(recordId: string, repository: Repository): Promise<any> {
        const collectionName = repository.getCollectionName();
        
        // Skip logging if disabled or if it's actionsHistory collection
        if (!this.isLoggingEnabled || collectionName === 'actionsHistory') {
            return null;
        }

        const session = await this.getSessionService().getUserFromSession();

        const dataBeforeDelete = await repository.findById(recordId);

        if (!dataBeforeDelete) {
            throw new Error(`Record with ID ${recordId} not found for deletion.`);
        }

        return this.repositoryHistoryRepository.create({
            recordId: recordId,
            action: 'hard-delete',
            source: collectionName,
            author: session,
            timestamp: new Date(),
            before: dataBeforeDelete,
            after: null,
        });
    }

    async createRestoreRecord(recordId: string, repository: Repository): Promise<any> {
        const collectionName = repository.getCollectionName();
        
        // Skip logging if disabled or if it's actionsHistory collection
        if (!this.isLoggingEnabled || collectionName === 'actionsHistory') {
            return null;
        }

        const session = await this.getSessionService().getUserFromSession();

        const dataBeforeRestore = await repository.findByIdDeleted(recordId);

        if (!dataBeforeRestore) {
            throw new Error(`Record with ID ${recordId} not found for restoration.`);
        }

        const dataAfterRestore = { ...dataBeforeRestore, deletedAt: null };

        return this.repositoryHistoryRepository.create({
            recordId: recordId,
            action: 'restore',
            source: collectionName,
            author: session,
            timestamp: new Date(),
            before: dataBeforeRestore,
            after: dataAfterRestore
        });
    }

    async createSoftDeleteRecord(recordId: string, repository: Repository, timeOfDeletion: Date): Promise<any> {
        const collectionName = repository.getCollectionName();
        
        // Skip logging if disabled or if it's actionsHistory collection
        if (!this.isLoggingEnabled || collectionName === 'actionsHistory') {
            return null;
        }

        const session = await this.getSessionService().getUserFromSession();

        const dataBeforeSoftDelete = await repository.findById(recordId);

        if (!dataBeforeSoftDelete) {
            throw new Error(`Record with ID ${recordId} not found for soft deletion.`);
        }

        const dataAfterSoftDelete = { ...dataBeforeSoftDelete, deletedAt: timeOfDeletion };

        return this.repositoryHistoryRepository.create({
            recordId: recordId,
            action: 'soft-delete',
            source: collectionName,
            author: session,
            timestamp: new Date(),
            before: dataBeforeSoftDelete,
            after: dataAfterSoftDelete,
        });
    }
    
    async createUpdateRecord(recordId: string, data: any, repository: Repository): Promise<any> {
        const collectionName = repository.getCollectionName();
        
        // Skip logging if disabled or if it's actionsHistory collection
        if (!this.isLoggingEnabled || collectionName === 'actionsHistory') {
            return null;
        }

        const session = await this.getSessionService().getUserFromSession();

        const dataBeforeUpdate = await repository.findById(recordId);

        if (!dataBeforeUpdate) {
            throw new Error(`Record with ID ${recordId} not found for update.`);
        }

        return this.repositoryHistoryRepository.create({
            recordId: recordId,
            action: 'update',
            source: collectionName,
            author: session,
            timestamp: new Date(),
            before: dataBeforeUpdate,
            after: data,
        });
    }

    async createErrorReportRecord(recordId: string | null, reportDetails: any, collectionName?: string): Promise<any> {
        // Skip logging if disabled or if it's actionsHistory collection
        if (!this.isLoggingEnabled || collectionName === 'actionsHistory') {
            return null;
        }

        const session = await this.getSessionService().getUserFromSession();

        return this.repositoryHistoryRepository.create({
            recordId: recordId,
            action: 'error-report',
            source: collectionName,
            details: reportDetails,
            author: session,
            timestamp: new Date(),
            before: null,
            after: null
        });
    }

    async rollbackRecord(historyRecordId: string): Promise<any> {
        await this.repositoryHistoryRepository.delete(historyRecordId);
    }
}