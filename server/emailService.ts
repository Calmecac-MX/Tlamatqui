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
    tls: {
      rejectUnauthorized: false // Permite certificados autofirmados o conexiones de prueba
    }
  });
}

/**
 * Verifica la conexión con el servidor SMTP.
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!isSmtpConfigured()) {
      return { success: false, message: "SMTP no está configurado en las variables de entorno (SMTP_HOST es requerido)." };
    }
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: "Conexión exitosa con el servidor SMTP." };
  } catch (error: any) {
    return { success: false, message: `Error al verificar la conexión SMTP: ${error.message}` };
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
      background-color: #0b0f19;
      color: #e2e8f0;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #151d30;
      border: 1px solid #23314f;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0;
      font-size: 14px;
      color: #e0e7ff;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 16px;
    }
    .card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #60a5fa;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
    }
    .note-box {
      background-color: #1e293b;
      border-left: 4px solid #6366f1;
      padding: 16px;
      border-radius: 6px;
      margin: 20px 0;
      font-style: italic;
      color: #cbd5e1;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 20px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
    }
    .footer {
      background-color: #0f172a;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #1e293b;
    }
    .footer a {
      color: #60a5fa;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tlamatqui Diagnostics</h1>
      <p>Suite de Auditoría Financiera y Comparativa de Comercio Electrónico</p>
    </div>
    <div class="content">
      <div class="greeting">Hola,</div>
      <p>Adjunto encontrarás el resultado del análisis financiero y auditoría operativa realizado para el comercio <strong>${storeName}</strong>.</p>
      
      <div class="card">
        <div class="card-title">Comercio Auditado</div>
        <div class="card-value">${storeName}</div>
        ${gmvFormatted ? `<div style="margin-top: 10px; font-size: 13px; color: #94a3b8;">GMV Mensual Estimado: <strong style="color: #38bdf8;">${gmvFormatted}</strong></div>` : ''}
      </div>

      ${note ? `
      <div class="note-box">
        <strong>Nota del Consultor:</strong><br>
        ${note.replace(/\n/g, '<br>')}
      </div>
      ` : ''}

      <p>Puedes acceder al reporte interactivo completo, comparar plataformas y visualizar la proyección de ahorros haciendo clic en el siguiente botón:</p>
      
      <div class="btn-container">
        <a href="${reportUrl}" class="btn" target="_blank">Ver Reporte Interactivo</a>
      </div>
      
      <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 24px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <a href="${reportUrl}" style="color: #60a5fa; word-break: break-all;">${reportUrl}</a>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Tlamatqui Diagnostics. Todos los derechos reservados.<br>
      Este correo fue enviado de forma automática desde la plataforma de analítica ejecutiva.
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Envía un diagnóstico financiero por correo electrónico vía SMTP.
 */
export async function sendReportEmail(options: SendReportEmailOptions): Promise<{ success: boolean; messageId?: string }> {
  const transporter = createTransporter();
  const config = getSmtpConfig();

  const subject = options.customSubject && options.customSubject.trim() !== ""
    ? options.customSubject
    : `Diagnóstico Financiero y Auditoría de Comercio: ${options.storeName}`;

  const htmlContent = buildReportEmailHtml(options);

  const attachments = [];
  if (options.pdfBase64 && options.pdfBase64.trim() !== "") {
    const cleanBase64 = options.pdfBase64.includes(",") ? options.pdfBase64.split(",")[1] : options.pdfBase64;
    attachments.push({
      filename: `Diagnostico-${options.storeName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      content: Buffer.from(cleanBase64, "base64"),
      contentType: "application/pdf"
    });
  }

  const info = await transporter.sendMail({
    from: config.from,
    to: options.toEmail,
    subject: subject,
    html: htmlContent,
    attachments: attachments.length > 0 ? attachments : undefined
  });

  console.log(`\x1b[32m[SMTP Email]\x1b[0m Correo enviado exitosamente a ${options.toEmail}. ID: ${info.messageId}`);

  return { success: true, messageId: info.messageId };
}
