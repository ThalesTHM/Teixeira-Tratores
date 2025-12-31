import { Repository } from "./GeneralRepository";

export class UsersRepository extends Repository {
    constructor() {
        super('users');
    }

    async findByEmail(email: string): Promise<any | null> {
        const results = await this.findByField('email', email);
        return results.length > 0 ? results[0] : null;
    }
}

export class BillsToPayRepository extends Repository {
    constructor() {
        super('billsToPay');
    }
}

export class BillsToReceiveRepository extends Repository {
    constructor() {
        super('billsToReceive');
    }
}

export class EquipmentRepository extends Repository {
    constructor() {
        super('equipment');
    }
}

export class MachineryRepository extends Repository {
    constructor() {
        super('machinery');
    }
}

export class ClientsRepository extends Repository {
    constructor() {
        super('clients');
    }
}

export class ProjectsRepository extends Repository {
    constructor() {
        super('projects');
    }
}

export class EmployeeHoursRepository extends Repository {
    constructor() {
        super('employeeHours');
    }
}

export class NotificationsRepository extends Repository {
    constructor() {
        super('notifications');
    }
}

export class SuppliersRepository extends Repository {
    constructor() {
        super('suppliers');
    }
}

export class PasswordRecoveryRequestsRepository extends Repository {
    constructor() {
        super('passwordRecoveryRequests');
    }

    async findByEmail(email: string): Promise<any | null> {
        const results = await this.findByField('email', email);
        
        return results.length > 0 ? results[0] : null;
    }

    async allowPasswordRecovery(email: string, code: string): Promise<void> {
        const request = await this.findByEmail(email);
        if (request) {
            // Update with code, set used=false, and soft delete (mark as allowed)
            await this.update(request.id, { code, used: false });
            await this.delete(request.id); // Soft delete
        }
    }

    async getAllowedRequests(): Promise<any[]> {
        // Get soft deleted records that are NOT used and NOT denied (these are the "allowed" ones)
        const deletedRecords = await this.findDeleted();
        return deletedRecords.filter(req => req.used !== true && req.denied !== true);
    }

    async findAllowedByEmail(email: string): Promise<any | null> {
        const allowedRequests = await this.getAllowedRequests();
        const found = allowedRequests.find(req => req.email === email);
        return found || null;
    }

    async markAsUsed(id: string): Promise<void> {
        // Mark the request as used (this will hide it from all lists)
        await this.update(id, { used: true });
    }

    async markAsDenied(email: string): Promise<void> {
        const request = await this.findByEmail(email);
        if (request) {
            // Mark as denied and soft delete
            await this.update(request.id, { denied: true });
            await this.delete(request.id);
        }
        
        // Also check if there's an allowed request and mark it as denied
        const allowedRequest = await this.findAllowedByEmail(email);
        if (allowedRequest) {
            await this.update(allowedRequest.id, { denied: true });
        }
    }
}