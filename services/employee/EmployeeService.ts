"server only";

import { UsersRepository } from "@/database/repositories/Repositories";
import { adminAuth } from "@/firebase/firebase-admin";
import { SessionService } from "@/services/session/SessionService";
import { nanoid } from "nanoid";

export interface Employee {
  id: string;
  address: string;
  cpf: string;
  createdAt: Date;
  email: string;
  name: string;
  pnumber: string;
  role: string;
  slug: string;
  updatedAt?: Date;
}

export type CreateEmployeeResult = {
    success: boolean;
    employeeId?: string;
    slug?: string;
    error?: string;
};

export type UpdateEmployeeResult = {
    success: boolean;
    error?: string;
};

export type DeleteEmployeeResult = {
    success: boolean;
    error?: string;
};

export type GetEmployeeResult = {
    success: boolean;
    employee?: Employee;
    error?: string;
};

export type GetEmployeesResult = {
    success: boolean;
    employees?: Employee[];
    error?: string;
};

function generateSlug() {
    // Example: abcd12-efg34-hijk56-lmnop7
    return [nanoid(), nanoid(), nanoid(), nanoid()].join('-');
}

export class EmployeeService {
    private static sessionService = new SessionService();
    private static usersRepository = new UsersRepository();

    static async createEmployee(employeeData: {
        name: string;
        email: string;
        role: string;
        pnumber: string;
        cpf: string;
        address: string;
    }): Promise<CreateEmployeeResult> {
        try {
            const slug = generateSlug();
            
            const dataToCreate = {
                ...employeeData,
                used: false,
                slug: slug
            };

            const result = await this.usersRepository.create(dataToCreate);
            
            return { 
                success: true, 
                employeeId: result.id, 
                slug: slug,
                error: "" 
            };
        } catch (error) {
            console.error("Error creating employee:", error);
            return { success: false, error: "Error creating employee" };
        }
    }

    static async updateEmployee(slug: string, data: {
        name: string;
        email: string;
        role: string;
        pnumber: string;
        cpf: string;
        address: string;
    }): Promise<UpdateEmployeeResult> {
        try {
            const employee = await this.getEmployeeBySlug(slug);
            if (!employee.success || !employee.employee) {
                return { success: false, error: "Employee not found" };
            }

            await this.usersRepository.update(employee.employee.id, {
                name: data.name,
                email: data.email,
                role: data.role,
                pnumber: data.pnumber,
                cpf: data.cpf,
                address: data.address
            });

            return { success: true, error: "" };
        } catch (error) {
            console.error("Error updating employee:", error);
            return { success: false, error: "Error updating employee" };
        }
    }

    static async deleteEmployee(slug: string): Promise<DeleteEmployeeResult> {
        try {
            const employee = await this.getEmployeeBySlug(slug);
            if (!employee.success || !employee.employee) {
                return { success: false, error: "Employee not found" };
            }

            // Delete Firebase Auth user
            try {
                const user = await adminAuth.getUserByEmail(employee.employee.email);
                if (user) {
                    await adminAuth.deleteUser(user.uid);
                }
            } catch (error) {
                console.error("Error deleting auth user:", error);
                // Continue with database deletion even if auth deletion fails
            }

            // Soft delete from database
            await this.usersRepository.delete(employee.employee.id);

            return { success: true, error: "" };
        } catch (error) {
            console.error("Error deleting employee:", error);
            return { success: false, error: "Error deleting employee" };
        }
    }

    static async getEmployeeBySlug(slug: string): Promise<GetEmployeeResult> {
        try {
            const results = await this.usersRepository.findByField('slug', slug);
            
            if (results.length === 0) {
                return { success: false, error: "Employee not found" };
            }

            const employee = results[0] as Employee;
            return { success: true, employee, error: "" };
        } catch (error) {
            console.error("Error getting employee by slug:", error);
            return { success: false, error: "Error getting employee" };
        }
    }

    static async getAllEmployees(): Promise<GetEmployeesResult> {
        try {
            const employees = await this.usersRepository.findAll();
            return { success: true, employees: employees as Employee[], error: "" };
        } catch (error) {
            console.error("Error getting all employees:", error);
            return { success: false, error: "Error getting employees" };
        }
    }

    static async checkEmailExists(email: string): Promise<boolean> {
        try {
            await adminAuth.getUserByEmail(email);
            return true;
        } catch (error) {
            return false;
        }
    }

    static async updateEmployeeAuth(uid: string, email: string): Promise<{ success: boolean; error?: string }> {
        try {
            await adminAuth.updateUser(uid, { email });
            return { success: true };
        } catch (error) {
            console.error("Error updating user email:", error);
            return { success: false, error: "Error updating user email" };
        }
    }
}