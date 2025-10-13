import { Repository } from "./GeneralRepository";

export class UsersRepository extends Repository {
    constructor() {
        super('users');
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