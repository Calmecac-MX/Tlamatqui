/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio de envío de correos electrónicos vía SMTP utilizando Nodemailer.
 * Permite enviar diagnósticos financieros y reportes comparativos directamente a los clientes.
 */

import nodemailer from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface SendReportEmailOptions {
  toEmail: string;
  reportId: string;
  storeName: string;
  reportUrl: string;
  gmvFormatted?: string;
  customSubject?: string;
  note?: string;
  pdfBase64?: string;
}

export interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

/**
 * Auxiliar para extraer el nombre y correo de una cadena con formato "Nombre <email@dominio.com>".
 */
function parseSenderString(fromStr: string): { name?: string; email: string } {
  const match = fromStr.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
  if (match) {
    return { name: match[1]?.trim() || undefined, email: match[2].trim() };
  }
  return { email: fromStr.trim() };
}

/**
 * Obtiene la configuración de Brevo API desde las variables de entorno.
 */
export function getBrevoConfig(): BrevoConfig {
  const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_KEY || process.env.SENDINBLUE_API_KEY || "";
  let senderEmail = process.env.BREVO_SENDER_EMAIL || "";
  let senderName = process.env.BREVO_SENDER_NAME || "";

  if (!senderEmail) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "";
    const parsed = parseSenderString(from);
    senderEmail = parsed.email || "no-reply@tlamatqui.com";
    if (!senderName) senderName = parsed.name || "Tlamatqui Diagnostics";
  }

  return {
    apiKey,
    senderEmail,
    senderName: senderName || "Tlamatqui Diagnostics"
  };
}

/**
 * Comprueba si la API de Brevo está configurada activamente en el entorno.
 */
export function isBrevoConfigured(): boolean {
  const config = getBrevoConfig();
  return Boolean(config.apiKey && config.apiKey.trim() !== "");
}

/**
 * Comprueba si el servicio de correo (Brevo API o SMTP) está configurado en el entorno.
 */
export function isEmailConfigured(): boolean {
  return isBrevoConfigured() || isSmtpConfigured();
}

/**
 * Obtiene la configuración de SMTP desde las variables de entorno del sistema.
 */
export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.SMTP_FROM || `"Tlamatqui Diagnostics" <${user || "no-reply@tlamatqui.com"}>`;

  return { host, port, secure, user, pass, from };
}

/**
 * Comprueba si el servicio SMTP está configurado activamente en el entorno.
 */
export function isSmtpConfigured(): boolean {
  const config = getSmtpConfig();
  return Boolean(config.host && config.host.trim() !== "");
}

/**
 * Envía un correo transaccional utilizando la API REST v3 de Brevo (Sendinblue).
 */
async function sendEmailViaBrevoApi(payload: {
  toEmail: string;
  recipientName?: string;
  subject: string;
  htmlContent: string;
  attachments?: Array<{ filename: string; content: string; contentType?: string }>;
}): Promise<{ success: boolean; messageId?: string }> {
  const config = getBrevoConfig();
  if (!config.apiKey) {
    throw new Error("La clave de API de Brevo (BREVO_API_KEY) no está configurada.");
  }

  const brevoPayload: any = {
    sender: {
      name: config.senderName,
      email: config.senderEmail
    },
    to: [
      {
        email: payload.toEmail,
        ...(payload.recipientName ? { name: payload.recipientName } : {})
      }
    ],
    subject: payload.subject,
    htmlContent: payload.htmlContent
  };

  if (payload.attachments && payload.attachments.length > 0) {
    brevoPayload.attachment = payload.attachments.map(att => {
      const cleanBase64 = att.content.includes(",") ? att.content.split(",")[1] : att.content;
      return {
        name: att.filename,
        content: cleanBase64
      };
    });
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": config.apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(brevoPayload),
    signal: AbortSignal.timeout(5000)
  });


  const responseData: any = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = responseData.message || responseData.code || "Error desconocido al enviar correo vía Brevo API";
    console.error(`\x1b[31m[Brevo API Error]\x1b[0m Status: ${response.status} - ${errorMsg}`);
    throw new Error(`Error en la API de Brevo (${response.status}): ${errorMsg}`);
  }

  const messageId = responseData.messageId || responseData.messageIds?.[0] || `brevo_${Date.now()}`;
  console.log(`\x1b[32m[Brevo API]\x1b[0m Correo enviado exitosamente a ${payload.toEmail}. ID: ${messageId}`);

  return { success: true, messageId };
}

/**
 * Crea la instancia de Transporte de Nodemailer basada en la configuración actual.
 */
function createTransporter() {
  const config = getSmtpConfig();
  
  if (!config.host) {
    throw new Error("El servidor SMTP no está configurado (SMTP_HOST ausente).");
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? {
      user: config.user,
      pass: config.pass
    } : undefined,
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 4000,
    tls: {
      rejectUnauthorized: false // Permite certificados autofirmados o conexiones de prueba
    }
  });

}

/**
 * Verifica la conexión con el servicio de correo (Brevo API o Servidor SMTP).
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (isBrevoConfigured()) {
      const config = getBrevoConfig();
      const res = await fetch("https://api.brevo.com/v3/account", {
        method: "GET",
        headers: {
          "api-key": config.apiKey,
          "Accept": "application/json"
        }
      });
      if (res.ok) {
        const accountData: any = await res.json().catch(() => ({}));
        const email = accountData.email || config.senderEmail;
        return { success: true, message: `Conexión exitosa con la API de Brevo (Cuenta: ${email}).` };
      }
      const errData: any = await res.json().catch(() => ({}));
      return { success: false, message: `Error de autenticación con Brevo API (${res.status}): ${errData.message || "Clave API no válida"}` };
    }

    if (!isSmtpConfigured()) {
      return { success: false, message: "No hay ningún servicio de correo configurado (BREVO_API_KEY o SMTP_HOST son requeridos)." };
    }

    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: "Conexión exitosa con el servidor SMTP." };
  } catch (error: any) {
    return { success: false, message: `Error al verificar la conexión de correo: ${error.message}` };
  }
}


/**
 * Construye la plantilla HTML del correo de diagnóstico financiero.
 */
function buildReportEmailHtml(options: SendReportEmailOptions): string {
  const { storeName, reportUrl, gmvFormatted, note } = options;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnóstico Financiero - ${storeName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #060b17 !important;
      color: #e2e8f0 !important;
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    .btn-glow:hover {
      box-shadow: 0 0 25px rgba(46, 205, 183, 0.6) !important;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        border-radius: 0 !important;
      }
      .content-padding {
        padding: 24px 18px !important;
      }
      .header-padding {
        padding: 28px 18px !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#060b17; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Wrapper Table -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#060b17; width:100%; margin:0; padding:20px 0;">
    <tr>
      <td align="center" style="padding:10px;">
        
        <!-- Main Email Container -->
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#0e172a; border:1px solid rgba(46, 205, 183, 0.35); border-radius:16px; overflow:hidden; box-shadow:0 12px 35px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Mint Glow Accent Line -->
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #01a89e 0%, #2ecdb7 50%, #34d399 100%); line-height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td class="header-padding" align="center" style="background-color:#080d1a; padding:36px 32px; border-bottom:1px solid rgba(46, 205, 183, 0.15);">
              <span style="display:inline-block; font-family:'Courier New', Courier, monospace; font-size:11px; font-weight:700; color:#2ecdb7; background-color:rgba(46, 205, 183, 0.12); border:1px solid rgba(46, 205, 183, 0.3); border-radius:20px; padding:4px 14px; text-transform:uppercase; letter-spacing:2px; margin-bottom:14px;">
                [ CALMÉCAC OS // DIAGNÓSTICO ]
              </span>
              <h1 style="margin:12px 0 6px 0; font-size:26px; font-weight:900; color:#ffffff !important; letter-spacing:-0.5px; text-transform:uppercase;">
                TLAMATQUI <span style="color:#2ecdb7 !important;">DIAGNOSTICS</span>
              </h1>
              <p style="margin:0; font-size:13px; color:#94a3b8 !important; font-weight:500; letter-spacing:0.5px;">
                Suite de Auditoría Financiera y Comparativa de Comercio Electrónico
              </p>
            </td>
          </tr>

          <!-- Content Section -->
          <tr>
            <td class="content-padding" style="padding:36px 32px; background-color:#0e172a;">
              <div style="font-size:18px; font-weight:700; color:#ffffff !important; margin-bottom:16px;">
                Hola,
              </div>
              <p style="font-size:15px; color:#e2e8f0 !important; line-height:1.7; margin:0 0 24px 0;">
                Adjunto encontrarás el resultado del análisis financiero y auditoría operativa ejecutado para el comercio <strong style="color:#2ecdb7 !important; font-weight:700;">${storeName}</strong>.
              </p>
              
              <!-- Audit Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0; background-color:#131e36; border:1px solid rgba(46, 205, 183, 0.35); border-left:4px solid #2ecdb7; border-radius:14px; overflow:hidden;">
                <tr>
                  <td style="padding:24px;">
                    <div style="font-family:'Courier New', Courier, monospace; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#2ecdb7 !important; margin-bottom:8px;">
                      [ COMERCIO AUDITADO ]
                    </div>
                    <div style="font-size:24px; font-weight:900; color:#ffffff !important; letter-spacing:-0.5px;">
                      ${storeName}
                    </div>
                    ${gmvFormatted ? `
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px; padding-top:14px; border-top:1px solid rgba(255, 255, 255, 0.08);">
                      <tr>
                        <td style="font-size:13px; color:#94a3b8 !important;">GMV Mensual Estimado:</td>
                        <td align="right" style="font-size:18px; font-weight:800; color:#2ecdb7 !important;">${gmvFormatted}</td>
                      </tr>
                    </table>
                    ` : ''}
                  </td>
                </tr>
              </table>

              ${note ? `
              <!-- Consultant Note Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0; background-color:rgba(46, 205, 183, 0.06); border:1px solid rgba(46, 205, 183, 0.25); border-left:4px solid #2ecdb7; border-radius:10px;">
                <tr>
                  <td style="padding:20px;">
                    <div style="color:#2ecdb7 !important; font-size:12px; font-family:'Courier New', Courier, monospace; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">
                      💡 [ NOTA DEL CONSULTOR EJECUTIVO ]
                    </div>
                    <div style="color:#e2e8f0 !important; font-size:14px; font-style:italic; line-height:1.6;">
                      ${note.replace(/\n/g, '<br>')}
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="font-size:14px; color:#cbd5e1 !important; line-height:1.6; margin:24px 0 28px 0;">
                Puedes acceder al reporte interactivo completo, comparar plataformas y visualizar la proyección de ahorros haciendo clic en el siguiente botón:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${reportUrl}" target="_blank" class="btn-glow" style="display:inline-block; background:linear-gradient(135deg, #01a89e 0%, #2ecdb7 100%); color:#0b132b !important; font-size:15px; font-weight:800; text-decoration:none; text-transform:uppercase; letter-spacing:1px; padding:16px 36px; border-radius:12px; box-shadow:0 6px 22px rgba(46, 205, 183, 0.4); border:0;">
                      VER REPORTE INTERACTIVO
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Direct Link Fallback -->
              <p style="font-size:12px; color:#94a3b8 !important; text-align:center; margin-top:28px; line-height:1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="${reportUrl}" style="color:#2ecdb7 !important; word-break:break-all; text-decoration:underline;">${reportUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color:#060b17; padding:30px 32px; text-align:center; border-top:1px solid rgba(46, 205, 183, 0.15);">
              <p style="margin:0 0 10px 0; font-size:13px; font-weight:700; color:#2ecdb7 !important; letter-spacing:0.5px;">
                "Aquí no venimos a ver si podemos, sino porque podemos venimos."
              </p>
              <p style="margin:0 0 14px 0; font-size:10px; color:#94a3b8 !important; text-transform:uppercase; letter-spacing:1.5px; font-family:'Courier New', Courier, monospace;">
                [ CALMÉCAC OS // ALIANZA ESTRATÉGICA E-COMMERCE ]
              </p>
              <p style="margin:0; font-size:11px; color:#64748b !important; line-height:1.6;">
                &copy; ${new Date().getFullYear()} Tlamatqui Diagnostics &bull; Calmécac. Todos los derechos reservados.<br>
                Este correo fue enviado de forma automática desde la plataforma de analítica ejecutiva.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Envía un diagnóstico financiero por correo electrónico vía SMTP.
 */
export async function sendReportEmail(options: SendReportEmailOptions): Promise<{ success: boolean; messageId?: string }> {
  const subject = options.customSubject && options.customSubject.trim() !== ""
    ? options.customSubject
    : `Diagnóstico Financiero y Auditoría de Comercio: ${options.storeName}`;

  const htmlContent = buildReportEmailHtml(options);

  const attachments: Array<{ filename: string; content: string; contentType?: string }> = [];
  if (options.pdfBase64 && options.pdfBase64.trim() !== "") {
    const cleanBase64 = options.pdfBase64.includes(",") ? options.pdfBase64.split(",")[1] : options.pdfBase64;
    attachments.push({
      filename: `Diagnostico-${options.storeName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      content: cleanBase64,
      contentType: "application/pdf"
    });
  }

  // Si la API de Brevo está configurada, enviar vía Brevo REST API v3
  if (isBrevoConfigured()) {
    return sendEmailViaBrevoApi({
      toEmail: options.toEmail,
      subject,
      htmlContent,
      attachments
    });
  }

  // Fallback a Nodemailer SMTP
  const transporter = createTransporter();
  const config = getSmtpConfig();

  const info = await transporter.sendMail({
    from: config.from,
    to: options.toEmail,
    subject: subject,
    html: htmlContent,
    attachments: attachments.map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, "base64"),
      contentType: att.contentType
    }))
  });

  console.log(`\x1b[32m[SMTP Email]\x1b[0m Correo enviado exitosamente a ${options.toEmail}. ID: ${info.messageId}`);

  return { success: true, messageId: info.messageId };
}


export interface SendTeamInviteEmailOptions {
  toEmail: string;
  recipientName?: string;
  teamName: string;
  inviterName?: string;
  role: string;
  inviteUrl: string;
  customNote?: string;
}

/**
 * Construye la plantilla HTML del correo de invitación al equipo.
 */
function buildTeamInviteEmailHtml(options: SendTeamInviteEmailOptions): string {
  const { recipientName, teamName, inviterName, role, inviteUrl, customNote } = options;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a equipo - ${teamName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #060b17 !important;
      color: #e2e8f0 !important;
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    .btn-glow:hover {
      box-shadow: 0 0 25px rgba(46, 205, 183, 0.6) !important;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        border-radius: 0 !important;
      }
      .content-padding {
        padding: 24px 18px !important;
      }
      .header-padding {
        padding: 28px 18px !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#060b17; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Wrapper Table -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#060b17; width:100%; margin:0; padding:20px 0;">
    <tr>
      <td align="center" style="padding:10px;">
        
        <!-- Main Email Container -->
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#0e172a; border:1px solid rgba(46, 205, 183, 0.35); border-radius:16px; overflow:hidden; box-shadow:0 12px 35px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Mint Glow Accent Line -->
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #01a89e 0%, #2ecdb7 50%, #34d399 100%); line-height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td class="header-padding" align="center" style="background-color:#080d1a; padding:36px 32px; border-bottom:1px solid rgba(46, 205, 183, 0.15);">
              <span style="display:inline-block; font-family:'Courier New', Courier, monospace; font-size:11px; font-weight:700; color:#2ecdb7; background-color:rgba(46, 205, 183, 0.12); border:1px solid rgba(46, 205, 183, 0.3); border-radius:20px; padding:4px 14px; text-transform:uppercase; letter-spacing:2px; margin-bottom:14px;">
                [ CALMÉCAC WORKSPACE // INVITACIÓN ]
              </span>
              <h1 style="margin:12px 0 6px 0; font-size:26px; font-weight:900; color:#ffffff !important; letter-spacing:-0.5px; text-transform:uppercase;">
                TLAMATQUI <span style="color:#2ecdb7 !important;">WORKSPACE</span>
              </h1>
              <p style="margin:0; font-size:13px; color:#94a3b8 !important; font-weight:500; letter-spacing:0.5px;">
                Invitación a Colaborar en Diagnósticos Financieros
              </p>
            </td>
          </tr>

          <!-- Content Section -->
          <tr>
            <td class="content-padding" style="padding:36px 32px; background-color:#0e172a;">
              <div style="font-size:18px; font-weight:700; color:#ffffff !important; margin-bottom:16px;">
                Hola ${recipientName ? recipientName : ''},
              </div>
              <p style="font-size:15px; color:#e2e8f0 !important; line-height:1.7; margin:0 0 24px 0;">
                ${inviterName ? `<strong style="color:#ffffff !important;">${inviterName}</strong>` : 'Un administrador'} te ha invitado a unirte como colaborador al equipo de trabajo en Tlamatqui.
              </p>
              
              <!-- Team Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0; background-color:#131e36; border:1px solid rgba(46, 205, 183, 0.35); border-left:4px solid #2ecdb7; border-radius:14px; overflow:hidden;">
                <tr>
                  <td style="padding:24px;">
                    <div style="font-family:'Courier New', Courier, monospace; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#2ecdb7 !important; margin-bottom:8px;">
                      [ EQUIPO DE TRABAJO ]
                    </div>
                    <div style="font-size:24px; font-weight:900; color:#ffffff !important; letter-spacing:-0.5px;">
                      ${teamName}
                    </div>
                    <div style="margin-top:14px; display:inline-block; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; background-color:rgba(46, 205, 183, 0.15); color:#2ecdb7 !important; border:1px solid rgba(46, 205, 183, 0.4);">
                      Rol Asignado: <strong style="color:#ffffff !important;">${role}</strong>
                    </div>
                  </td>
                </tr>
              </table>

              ${customNote ? `
              <!-- Personal Note Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0; background-color:rgba(46, 205, 183, 0.06); border:1px solid rgba(46, 205, 183, 0.25); border-left:4px solid #2ecdb7; border-radius:10px;">
                <tr>
                  <td style="padding:20px;">
                    <div style="color:#2ecdb7 !important; font-size:12px; font-family:'Courier New', Courier, monospace; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">
                      📩 [ MENSAJE PERSONALIZADO ]
                    </div>
                    <div style="color:#e2e8f0 !important; font-size:14px; font-style:italic; line-height:1.6;">
                      ${customNote.replace(/\n/g, '<br>')}
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="font-size:14px; color:#cbd5e1 !important; line-height:1.6; margin:24px 0 28px 0;">
                Haz clic en el siguiente botón para aceptar la invitación y unirte directamente al espacio de trabajo:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" class="btn-glow" style="display:inline-block; background:linear-gradient(135deg, #01a89e 0%, #2ecdb7 100%); color:#0b132b !important; font-size:15px; font-weight:800; text-decoration:none; text-transform:uppercase; letter-spacing:1px; padding:16px 36px; border-radius:12px; box-shadow:0 6px 22px rgba(46, 205, 183, 0.4); border:0;">
                      ACEPTAR INVITACIÓN Y UNIRME
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Direct Link Fallback -->
              <p style="font-size:12px; color:#94a3b8 !important; text-align:center; margin-top:28px; line-height:1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="${inviteUrl}" style="color:#2ecdb7 !important; word-break:break-all; text-decoration:underline;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color:#060b17; padding:30px 32px; text-align:center; border-top:1px solid rgba(46, 205, 183, 0.15);">
              <p style="margin:0 0 10px 0; font-size:13px; font-weight:700; color:#2ecdb7 !important; letter-spacing:0.5px;">
                "Aquí no venimos a ver si podemos, sino porque podemos venimos."
              </p>
              <p style="margin:0 0 14px 0; font-size:10px; color:#94a3b8 !important; text-transform:uppercase; letter-spacing:1.5px; font-family:'Courier New', Courier, monospace;">
                [ CALMÉCAC OS // ALIANZA ESTRATÉGICA E-COMMERCE ]
              </p>
              <p style="margin:0; font-size:11px; color:#64748b !important; line-height:1.6;">
                &copy; ${new Date().getFullYear()} Tlamatqui Diagnostics &bull; Calmécac. Todos los derechos reservados.<br>
                Plataforma de Auditoría Financiera y Analítica Ejecutiva para E-commerce.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Envía una invitación por correo electrónico a un nuevo miembro del equipo.
 */
export async function sendTeamInviteEmail(options: SendTeamInviteEmailOptions): Promise<{ success: boolean; messageId?: string }> {
  const subject = `Te han invitado a unirte al equipo "${options.teamName}" en Tlamatqui`;
  const htmlContent = buildTeamInviteEmailHtml(options);

  // Si la API de Brevo está configurada, enviar vía Brevo REST API v3
  if (isBrevoConfigured()) {
    return sendEmailViaBrevoApi({
      toEmail: options.toEmail,
      recipientName: options.recipientName,
      subject,
      htmlContent
    });
  }

  // Fallback a Nodemailer SMTP
  const transporter = createTransporter();
  const config = getSmtpConfig();

  const info = await transporter.sendMail({
    from: config.from,
    to: options.toEmail,
    subject: subject,
    html: htmlContent
  });

  console.log(`\x1b[32m[SMTP Email]\x1b[0m Invitación enviada exitosamente a ${options.toEmail}. ID: ${info.messageId}`);

  return { success: true, messageId: info.messageId };
}


