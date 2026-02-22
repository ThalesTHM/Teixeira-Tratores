const WHATSAPP_API_BASE = "https://graph.facebook.com";

interface SendWhatsAppOptions {
    to: string | string[];
    message: string;
}

interface SendWhatsAppTemplateOptions {
    to: string | string[];
    templateName: string;
    languageCode?: string;
    components?: TemplateComponent[];
}

interface TemplateComponent {
    type: "header" | "body" | "button";
    parameters: TemplateParameter[];
}

interface TemplateParameter {
    type: "text" | "currency" | "date_time" | "image" | "document" | "video";
    text?: string;
}

interface SendWhatsAppResult {
    success: boolean;
    messageIds?: string[];
    error?: string;
}

interface MetaApiResponse {
    messaging_product: string;
    contacts?: Array<{ input: string; wa_id: string }>;
    messages?: Array<{ id: string }>;
    error?: { message: string; type: string; code: number };
}

export class WhatsAppService {
    private phoneNumberId: string;
    private accessToken: string;
    private apiVersion: string;

    constructor() {
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v22.0";

        if (!phoneNumberId || !accessToken) {
            throw new Error(
                "[WhatsAppService] Missing Meta env vars. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN."
            );
        }

        this.phoneNumberId = phoneNumberId;
        this.accessToken = accessToken;
        this.apiVersion = apiVersion;
    }

    private get endpoint(): string {
        return `${WHATSAPP_API_BASE}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    }

    private async postToMeta(body: Record<string, unknown>): Promise<MetaApiResponse> {
        const response = await fetch(this.endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = (await response.json()) as MetaApiResponse;

        if (!response.ok || data.error) {
            throw new Error(data.error?.message ?? `HTTP ${response.status}`);
        }

        return data;
    }

    private async sendTextToRecipient(phone: string, text: string): Promise<{ id: string }> {
        const data = await this.postToMeta({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phone,
            type: "text",
            text: { preview_url: false, body: text },
        });

        return { id: data.messages?.[0]?.id ?? "" };
    }

    private async sendTemplateToRecipient(
        phone: string,
        templateName: string,
        languageCode: string,
        components?: TemplateComponent[]
    ): Promise<{ id: string }> {
        const template: Record<string, unknown> = {
            name: templateName,
            language: { code: languageCode },
        };

        if (components && components.length > 0) {
            template.components = components;
        }

        const data = await this.postToMeta({
            messaging_product: "whatsapp",
            to: phone,
            type: "template",
            template,
        });

        return { id: data.messages?.[0]?.id ?? "" };
    }

    private async sendToMultiple(
        recipients: string[],
        sendFn: (phone: string) => Promise<{ id: string }>
    ): Promise<SendWhatsAppResult> {
        try {
            const results = await Promise.allSettled(recipients.map(sendFn));

            const messageIds: string[] = [];
            const errors: string[] = [];

            for (const result of results) {
                if (result.status === "fulfilled") {
                    messageIds.push(result.value.id);
                } else {
                    errors.push(result.reason?.message ?? "Unknown error");
                }
            }

            if (errors.length > 0 && messageIds.length === 0) {
                return { success: false, error: errors.join("; ") };
            }

            return { success: true, messageIds };
        } catch (error) {
            console.error("[WhatsAppService] Failed to send message:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error sending WhatsApp message",
            };
        }
    }

    async sendMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
        const recipients = Array.isArray(options.to) ? options.to : [options.to];
        return this.sendToMultiple(recipients, (phone) =>
            this.sendTextToRecipient(phone, options.message)
        );
    }

    async sendTemplate(options: SendWhatsAppTemplateOptions): Promise<SendWhatsAppResult> {
        const recipients = Array.isArray(options.to) ? options.to : [options.to];
        const lang = options.languageCode ?? "en_US";
        return this.sendToMultiple(recipients, (phone) =>
            this.sendTemplateToRecipient(phone, options.templateName, lang, options.components)
        );
    }

    async sendBillExpirationNotification(
        to: string | string[],
        billName: string,
        daysUntilExpiry: number,
        billType: "pay" | "receive"
    ): Promise<SendWhatsAppResult> {
        const typeLabel = billType === "pay" ? "a Pagar" : "a Receber";

        let stateEmoji: string;
        let stateLabel: string;

        if (daysUntilExpiry <= 0) {
            stateEmoji = "🔴";
            stateLabel = "VENCIDA";
        } else if (daysUntilExpiry <= 7) {
            stateEmoji = "🟡";
            stateLabel = "PRÓXIMA A VENCER";
        } else {
            stateEmoji = "🟢";
            stateLabel = "PENDENTE";
        }

        const whenText =
            daysUntilExpiry <= 0
                ? `vencida há ${Math.abs(daysUntilExpiry)} dia(s)`
                : daysUntilExpiry === 0
                  ? "vence hoje"
                  : daysUntilExpiry === 1
                    ? "vence amanhã"
                    : `vence em ${daysUntilExpiry} dia(s)`;

        const message = [
            `${stateEmoji} *Notificação de Conta — ${stateLabel}*`,
            "",
            `*Nome:* ${billName}`,
            `*Tipo:* ${typeLabel}`,
            `*Status:* ${stateLabel}`,
            `*Vencimento:* ${whenText}`,
            "",
            "Acesse o sistema para ver mais detalhes.",
            "",
            "_Mensagem automática — não responda._",
        ].join("\n");

        return this.sendTemplate({
            to,
            templateName: "hello_world",
            languageCode: "en_US",
        });
    }

    async sendGenericNotification(
        to: string | string[],
        title: string,
        body: string
    ): Promise<SendWhatsAppResult> {
        return this.sendTemplate({
            to,
            templateName: "hello_world",
            languageCode: "en_US",
        });
    }
}
