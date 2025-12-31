"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { EmployeeService } from "@/services/employee/EmployeeService";
import { SessionService } from "@/services/session/SessionService";

export const removeEmployee = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession()

  if(!session){
    return {success: false, error: 'User not authenticated.'}
  }

  // Get employee data before deletion for notification
  const employeeResult = await EmployeeService.getEmployeeBySlug(slug);
  if (!employeeResult.success) {
    return { success: false, error: employeeResult.error || "Employee Not Found" };
  }

  const employee = employeeResult.employee!;
  const name = employee.name || "Funcionário";

  const deleteResult = await EmployeeService.deleteEmployee(slug);
  if (!deleteResult.success) {
    return { success: false, error: deleteResult.error || "Error Deleting Employee" };
  }

  // Notification
  const notification = {
    message: `Funcionário "${name}" foi excluído.`,
    role: NotificationRole.MANAGER,
    createdBy: session.name,
    priority: NotificationPriority.MEDIUM,
    notificationSource: NotificationSource.EMPLOYEE
  };
  const notificationRes = await NotificationsService.createNotification(notification);
  if (!notificationRes.success) {
    return { success: false, error: 'Error creating notification' };
  }
  return { success: true };
};
