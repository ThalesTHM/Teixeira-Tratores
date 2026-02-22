import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NEXT_PUBLIC_GMAIL_USER,
        pass: process.env.NEXT_PUBLIC_GMAIL_APP_PASSWORD,
      },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.NEXT_PUBLIC_GMAIL_FROM_NAME || "Sistema"}" <${process.env.NEXT_PUBLIC_GMAIL_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("[EmailService] Failed to send email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error sending email",
      };
    }
  }

  async sendBillExpirationNotification(
    to: string | string[],
    billName: string,
    daysUntilExpiry: number,
    billType: "pay" | "receive"
  ): Promise<SendEmailResult> {
    const typeLabel = billType === "pay" ? "a Pagar" : "a Receber";

    // Determine state and color based on days until expiry
    let stateLabel = "";
    let color = "#16a34a"; // default green
    if (daysUntilExpiry <= 0) {
      stateLabel = "VENCIDA";
      color = "#dc2626";
    } else if (daysUntilExpiry <= 7) {
      stateLabel = "PRÓXIMA VENCER";
      color = "#f59e0b";
    } else {
      stateLabel = "PENDENTE";
      color = "#16a34a";
    }

    const whenText = daysUntilExpiry <= 0
      ? `vencida há ${Math.abs(daysUntilExpiry)} dia(s)`
      : `vence em ${daysUntilExpiry} dia(s)`;

    const subject = daysUntilExpiry <= 0
      ? `⚠️ Conta ${typeLabel} ${stateLabel}: ${billName}`
      : `📋 Conta ${typeLabel} ${stateLabel}: ${billName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827;">
        <div style="background-color: ${color}; color: white; padding: 12px; border-radius: 6px;">
          <h2 style="margin: 0; font-size: 18px;">Notificação de Conta — ${stateLabel}</h2>
        </div>

        <div style="margin-top: 16px;">
          <p style="margin: 0 0 8px 0;"><strong>Nome:</strong> ${billName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Tipo:</strong> ${typeLabel}</p>
          <p style="margin: 0 0 8px 0;"><strong>Status:</strong> ${stateLabel}</p>
          <p style="margin: 0 0 8px 0;"><strong>Vencimento:</strong> ${whenText}</p>

          <p style="margin: 12px 0 0 0; color: #374151;">Acesse o sistema para ver mais detalhes sobre esta conta.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />

          <p style="font-size: 12px; color: #6b7280; margin: 0;">Esta é uma mensagem automática — por favor, NÃO responda a este e-mail.</p>
        </div>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }
}
