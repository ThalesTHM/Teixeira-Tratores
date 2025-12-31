"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { EmployeeService } from "@/services/employee/EmployeeService";
import { employeeFormSchema } from "./validation";
import { z } from "zod";
import { SessionService } from "@/services/session/SessionService";

const checkIfEmployeeIsEqual = (originalEmployee: any, data: any) => {
  return originalEmployee.name === data.name &&
         originalEmployee.email === data.email &&
         originalEmployee.role === data.role &&
         originalEmployee.pnumber === data.pnumber &&
         originalEmployee.cpf === data.cpf &&
         originalEmployee.address === data.address;
}

export const editEmployee = async (slug: string, data: any) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    return { success: false, error: "User Not Authenticated" };
  }

  try {
    await employeeFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      return {
        success: false,
        error: fieldErrors
      };
    }
  }

  const originalEmployeeRes = await EmployeeService.getEmployeeBySlug(slug);
  
  if (!originalEmployeeRes.success) {
    return { success: false, error: originalEmployeeRes.error };
  }

  const originalEmployee = originalEmployeeRes.employee!;

  if (checkIfEmployeeIsEqual(originalEmployee, data)) {
    return { success: false, error: "An employee with the same data already exists." };
  }

  if(originalEmployee.email !== data.email){
    const emailInUse = await EmployeeService.checkEmailExists(data.email);
    if (emailInUse) {
      return { success: false, error: "Email already in use" };
    }
  }

  if(originalEmployee.email !== data.email) {
    const authUpdateResult = await EmployeeService.updateEmployeeAuth(session?.uid as string, data.email);
    if (!authUpdateResult.success) {
      return { success: false, error: authUpdateResult.error || "Error Updating User Email" };
    }
  }

  const updateResult = await EmployeeService.updateEmployee(slug, data);
  if (!updateResult.success) {
    return { success: false, error: updateResult.error || "Error Editing Employee" };
  }

  // Notification
  const name = originalEmployee.name || "Funcionário";
  const notification = {
    message: `Funcionário "${name}" foi editado.`,
    role: NotificationRole.MANAGER,
    slug: originalEmployee.slug,
    createdBy: session.name,
    priority: NotificationPriority.LOW,
    notificationSource: NotificationSource.EMPLOYEE
  };
  const notificationRes = await NotificationsService.createNotification(notification);
  if (!notificationRes.success) {
    return { success: false, error: 'Error creating notification' };
  }
  return { success: true, error: ""};
};
