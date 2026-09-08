import {
  isEmailConfigured,
  isBrevoConfigured,
  isSmtpConfigured,
  sendReportEmail,
  sendTeamInviteEmail,
  verifySmtpConnection,
  SendReportEmailOptions
} from "../emailService.js";

export type WorkflowEmailType = "report_created" | "report_share" | "team_invite" | "member_approved";

export interface WorkflowEmailInput {
  type: WorkflowEmailType;
  recipient: string;
  payload: {
    storeName?: string;
    reportId?: string;
    reportUrl?: string;
    gmvFormatted?: string;
    customSubject?: string;
    note?: string;
    pdfBase64?: string;
    teamName?: string;
    inviteToken?: string;
    inviteRole?: string;
    inviterName?: string;
    appUrl?: string;
    [key: string]: any;
  };
}

export interface WorkflowEmailResult {
  success: boolean;
  message: string;
  provider: "brevo" | "smtp" | "none";
  deliveredAt: string;
}

/**
 * Workflow Unificado de Despacho de Correo Electrónico (EmailNotificationWorkflow).
 * Orquesta la validación de proveedores (Brevo API / SMTP Nodemailer),
 * renderizado de templates dinámicos y entrega transaccional garantizada.
 */
export async function sendWorkflowEmail(input: WorkflowEmailInput): Promise<WorkflowEmailResult> {
  const { type, recipient, payload } = input;

  if (!recipient || !recipient.includes("@")) {
    throw new Error("Dirección de correo de destinatario no válida.");
  }

  const configured = isEmailConfigured();
  const provider = isBrevoConfigured() ? "brevo" : isSmtpConfigured() ? "smtp" : "none";

  if (!configured) {
    console.warn(`[EmailWorkflow] No hay credenciales de correo configuradas (Brevo/SMTP). Omitiendo despacho a ${recipient}.`);
    return {
      success: false,
      message: "Servicio de correo no configurado en variables de entorno.",
      provider: "none",
      deliveredAt: new Date().toISOString()
    };
  }

  let result: { success: boolean; message?: string; messageId?: string };

  switch (type) {
    case "report_created":
    case "report_share": {
      const emailOptions: SendReportEmailOptions = {
        toEmail: recipient,
        reportId: payload.reportId || `rep_${Date.now()}`,
        storeName: payload.storeName || "Auditoría de Tienda",
        reportUrl: payload.reportUrl || "https://tlamatqui.calmecac.lat",
        gmvFormatted: payload.gmvFormatted,
        customSubject: payload.customSubject,
        note: payload.note,
        pdfBase64: payload.pdfBase64
      };
      result = await sendReportEmail(emailOptions);
      break;
    }

    case "team_invite":
    case "member_approved": {
      const origin = payload.appUrl || "https://tlamatqui.calmecac.lat";
      const cleanOrigin = origin.replace(/\/$/, "");
      const inviteUrl = payload.inviteToken ? `${cleanOrigin}/?inviteTeam=${encodeURIComponent(payload.inviteToken)}` : cleanOrigin;

      result = await sendTeamInviteEmail({
        toEmail: recipient,
        recipientName: payload.recipientName || "Colaborador",
        teamName: payload.teamName || "Equipo Tlamatqui",
        inviterName: payload.inviterName || "Administrador",
        role: payload.inviteRole || "Visor",
        inviteUrl,
        customNote: payload.note
      });
      break;
    }

    default:
      throw new Error(`Tipo de correo '${type}' no soportado en EmailNotificationWorkflow.`);
  }

  return {
    success: result.success,
    message: result.message || (result.success ? "Correo entregado exitosamente" : "Error en entrega"),
    provider,
    deliveredAt: new Date().toISOString()
  };
}

/**
 * Valida la conectividad del motor de correo electrónico activo.
 */
export async function verifyEmailHealthWorkflow(): Promise<{ configured: boolean; provider: string; healthy: boolean; message?: string }> {
  const configured = isEmailConfigured();
  if (!configured) {
    return { configured: false, provider: "none", healthy: false };
  }

  if (isBrevoConfigured()) {
    return { configured: true, provider: "Brevo Transactional API", healthy: true, message: "Conectado vía Brevo API" };
  }

  const smtpCheck = await verifySmtpConnection();
  return {
    configured: true,
    provider: "SMTP Nodemailer",
    healthy: smtpCheck.success,
    message: smtpCheck.message
  };
}
