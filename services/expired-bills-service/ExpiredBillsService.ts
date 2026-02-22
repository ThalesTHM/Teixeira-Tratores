import { BillsToPayRepository, BillsToReceiveRepository } from "@/database/repositories/Repositories";
import { NotificationsService, NotificationPriority, NotificationRole, NotificationSource } from "../notifications/NotificationsService";
import { EmailService } from "../email/EmailService";

export enum BillNotificationState {
    PAID = 0,
    GREEN = 1,
    YELLOW = 2,
    RED = 3,
}

function stripTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function calendarDayDiff(expireDate: number, now: Date): number {
    const expDate = stripTime(new Date(expireDate));
    const nowDate = stripTime(now);
    return Math.round((expDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateNotificationState(expireDate: number, now: Date): BillNotificationState {
    const diffDays = calendarDayDiff(expireDate, now);

    if (diffDays <= 0) return BillNotificationState.RED;
    if (diffDays <= 7) return BillNotificationState.YELLOW;
    if (diffDays <= 30) return BillNotificationState.GREEN;

    return BillNotificationState.PAID;
}

function notificationMessage(billName: string, daysUntilExpiry: number, type: "pagar" | "receber"): string {
    const absDays = Math.abs(daysUntilExpiry);

    if (daysUntilExpiry < 0) {
        return `A conta a ${type} "${billName}" está vencida há ${absDays} dia(s)!`;
    } else if (daysUntilExpiry === 0) {
        return `A conta a ${type} "${billName}" vence hoje!`;
    } else if (daysUntilExpiry === 1) {
        return `A conta a ${type} "${billName}" vence amanhã!`;
    } else {
        return `A conta a ${type} "${billName}" vence em ${daysUntilExpiry} dias.`;
    }
}

function notificationPriority(state: BillNotificationState): NotificationPriority {
    switch (state) {
        case BillNotificationState.RED: return NotificationPriority.HIGH;
        case BillNotificationState.YELLOW: return NotificationPriority.MEDIUM;
        case BillNotificationState.GREEN: return NotificationPriority.LOW;
        default: return NotificationPriority.ZERO;
    }
}

export class ExpiredBillsService {
    private billsToPayRepo = new BillsToPayRepository();
    private billsToReceiveRepo = new BillsToReceiveRepository();
    private emailService = new EmailService();

    async run(): Promise<{ updatedPay: number; updatedReceive: number }> {
        const now = new Date();

        const [payResult, receiveResult] = await Promise.all([
            this.processBills(this.billsToPayRepo, now, "pagar", NotificationSource.BILL_TO_PAY, "pay"),
            this.processBills(this.billsToReceiveRepo, now, "receber", NotificationSource.BILL_TO_RECEIVE, "receive"),
        ]);

        return { updatedPay: payResult, updatedReceive: receiveResult };
    }

    private async processBills(
        repo: BillsToPayRepository | BillsToReceiveRepository,
        now: Date,
        type: "pagar" | "receber",
        source: NotificationSource,
        billType: "pay" | "receive",
    ): Promise<number> {
        const allBills = await repo.findAll();

        const unpaidBills = allBills.filter(bill => bill.paymentStatus !== "P");

        const updates: Array<{ id: string; data: { notificationState: BillNotificationState }; bill: any; newState: BillNotificationState }> = [];

        for (const bill of unpaidBills) {
            const newState = calculateNotificationState(bill.expireDate, now);
            const currentState = bill.notificationState ?? null;

            if (newState !== BillNotificationState.PAID && newState !== currentState) {
                updates.push({ id: bill.id, data: { notificationState: newState }, bill, newState });
            }
        }

        if (updates.length === 0) return 0;

        await repo.bulkUpdate(updates.map(u => ({ id: u.id, data: u.data })));

        const notifyEmail = process.env.NEXT_PUBLIC_GMAIL_USER;
        await Promise.all(
            updates.map(async (u) => {
                const daysUntilExpiry = calendarDayDiff(u.bill.expireDate, now);

                await NotificationsService.createNotification({
                    message: notificationMessage(u.bill.name, daysUntilExpiry, type),
                    role: NotificationRole.MANAGER,
                    priority: notificationPriority(u.newState),
                    notificationSource: source,
                    slug: u.bill.slug ?? null,
                    createdBy: "SYSTEM",
                });

                if (notifyEmail) {
                    await this.emailService.sendBillExpirationNotification(
                        notifyEmail,
                        u.bill.name,
                        daysUntilExpiry,
                        billType,
                    );
                }
            })
        );

        return updates.length;
    }
}