import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || "";
const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
const defaultFrom =
  process.env.EMAIL_FROM ||
  process.env.SENDGRID_FROM_EMAIL ||
  smtpUser ||
  "joblify.noreply@gmail.com";

const sendGridApiKey = process.env.SENDGRID_API_KEY || "";
const sendGridEnabled = Boolean(sendGridApiKey);
if (sendGridEnabled) {
  sgMail.setApiKey(sendGridApiKey);
}

const smtpEnabled = Boolean(smtpUser && smtpPass);
const transporter = smtpEnabled
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    })
  : null;

const sendWithFallback = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  let smtpError: unknown = null;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Joblify" <${defaultFrom}>`,
        to,
        subject,
        html,
      });
      return { success: true };
    } catch (error) {
      smtpError = error;
      console.error("Error enviando email con SMTP:", error);
    }
  }

  if (sendGridEnabled) {
    try {
      await sgMail.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL || defaultFrom,
        subject,
        html,
      });
      return { success: true };
    } catch (sgError) {
      console.error("Error enviando con SendGrid:", sgError);
      if ((sgError as { code?: number }).code === 401) {
        throw new Error("SENDGRID_API_KEY invalida o sin permisos");
      }
      throw sgError;
    }
  }

  if (!transporter && !sendGridEnabled) {
    throw new Error("No hay proveedor de email configurado. Define SMTP_* o SENDGRID_API_KEY");
  }

  throw smtpError instanceof Error
    ? smtpError
    : new Error("No se pudo enviar el email");
};

export const emailService = {
  async sendVerificationEmail(email: string, verificationToken: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0071E3 0%, #0051BA 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Bienvenido a Joblify</h1>
        </div>
        <div style="padding: 40px 20px; background: #f5f5f7;">
          <p style="color: #1d1d1f; font-size: 16px; margin: 0 0 20px 0;">Hola,</p>
          <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
            Gracias por registrarte en Joblify. Para completar tu registro, verifica tu email haciendo clic en el boton de abajo.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: #0071E3; color: white; padding: 12px 32px; border-radius: 980px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Verificar Email
            </a>
          </div>
          <p style="color: #6e6e73; font-size: 12px; text-align: center; margin: 30px 0 0 0;">
            O copia este enlace en tu navegador:<br/>
            <span style="word-break: break-all;">${verificationUrl}</span>
          </p>
        </div>
      </div>
    `;

    try {
      await sendWithFallback({
        to: email,
        subject: "Verifica tu email en Joblify",
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Error enviando email de verificacion:", error);
      throw new Error("No se pudo enviar el email de verificacion");
    }
  },

  async sendWelcomeEmail(email: string, name: string) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0071E3 0%, #0051BA 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido, ${name}!</h1>
        </div>
        <div style="padding: 40px 20px; background: #f5f5f7;">
          <p style="color: #1d1d1f; font-size: 16px; margin: 0 0 20px 0;">Tu cuenta esta lista.</p>
          <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
            Ahora puedes acceder a Joblify y comenzar a explorar oportunidades, conectar con otros profesionales y crecer tu carrera.
          </p>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: #0071E3; color: white; padding: 12px 32px; border-radius: 980px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Ir a Joblify
            </a>
          </div>
        </div>
      </div>
    `;

    try {
      await sendWithFallback({
        to: email,
        subject: "Tu cuenta esta lista en Joblify",
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Error enviando email:", error);
      throw new Error("No se pudo enviar el email");
    }
  },

  async sendPasswordResetEmail(email: string, name: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0071E3 0%, #0051BA 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Recuperar contraseña</h1>
        </div>
        <div style="padding: 40px 20px; background: #f5f5f7;">
          <p style="color: #1d1d1f; font-size: 16px; margin: 0 0 20px 0;">Hola ${name},</p>
          <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
            Recibimos una solicitud para restablecer tu contraseña. Haz clic en el boton de abajo para continuar.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #0071E3; color: white; padding: 12px 32px; border-radius: 980px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Restablecer contraseña
            </a>
          </div>
        </div>
      </div>
    `;

    try {
      await sendWithFallback({
        to: email,
        subject: "Recupera tu contrasena en Joblify",
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Error enviando email:", error);
      throw new Error("No se pudo enviar el email");
    }
  },

  async sendVerificationCodeEmail(email: string, code: string, name?: string) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0071E3 0%, #0051BA 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verifica tu email</h1>
        </div>
        <div style="padding: 40px 20px; background: #f5f5f7;">
          <p style="color: #1d1d1f; font-size: 16px; margin: 0 0 20px 0;">Hola${name ? ` ${name}` : ""},</p>
          <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
            Gracias por registrarte en Joblify. Para completar tu registro, ingresa el siguiente codigo de verificacion:
          </p>
          <div style="text-align: center; margin: 30px 0; padding: 30px; background: white; border-radius: 12px; border: 2px dashed #0071E3;">
            <span style="font-size: 48px; font-weight: 700; color: #0071E3; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #6e6e73; font-size: 12px; text-align: center; margin: 30px 0 0 0;">
            Este codigo expira en 24 horas. Si no solicitaste este email, ignoralo.
          </p>
        </div>
      </div>
    `;

    try {
      await sendWithFallback({
        to: email,
        subject: "Tu codigo de verificacion - Joblify",
        html,
      });
      console.log(`[Email] Codigo de verificacion enviado a ${email}: ${code}`);
      return { success: true };
    } catch (error) {
      console.error("Error enviando email de verificacion:", error);
      throw new Error("No se pudo enviar el email de verificacion");
    }
  },

  async sendApplicationSubmittedEmail(email: string, name: string, jobTitle: string, companyName: string) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0071E3 0%, #0051BA 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Postulacion enviada</h1>
        </div>
        <div style="padding: 40px 20px; background: #f5f5f7;">
          <p style="color: #1d1d1f; font-size: 16px; margin: 0 0 20px 0;">Hola ${name || ""},</p>
          <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
            Confirmamos que tu postulacion fue enviada correctamente en Joblify.
          </p>
          <div style="background: white; border: 1px solid #e5e5ea; border-radius: 12px; padding: 16px; margin: 0 0 22px 0;">
            <p style="margin: 0 0 8px 0; color: #1d1d1f; font-size: 14px;"><strong>Vacante:</strong> ${jobTitle}</p>
            <p style="margin: 0; color: #1d1d1f; font-size: 14px;"><strong>Empresa:</strong> ${companyName}</p>
          </div>
          <p style="color: #6e6e73; font-size: 13px; line-height: 1.6; margin: 0;">
            Te notificaremos en cuanto haya cambios en el estado de tu proceso.
          </p>
        </div>
      </div>
    `;

    try {
      await sendWithFallback({
        to: email,
        subject: `Aplicaste a ${jobTitle} en Joblify`,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Error enviando email de aplicacion:", error);
      throw new Error("No se pudo enviar el email de aplicacion");
    }
  },

  async sendApplicationStatusEmail(
    email: string,
    name: string,
    jobTitle: string,
    companyName: string,
    status: string,
  ) {
    const statusLabel: Record<string, string> = {
      APLICADO: "Aplicado",
      SCREENING: "Screening",
      ENTREVISTA: "Entrevista",
      OFERTA: "Oferta",
      CONTRATADO: "Seleccionado",
      RECHAZADO: "No seleccionado",
    };

    const readableStatus = statusLabel[status] || status;
    const isHired = status === "CONTRATADO";
    const isRejected = status === "RECHAZADO";
    const heading = isHired
      ? "¡Bienvenido(a) al equipo!"
      : isRejected
      ? "Gracias por tu postulación"
      : "Actualización de tu postulación";
    const summary = isHired
      ? `¡Excelente noticia! Fuiste seleccionado para la vacante <strong>${jobTitle}</strong> en <strong>${companyName}</strong>.`
      : isRejected
      ? `Muchas gracias por postularte a <strong>${jobTitle}</strong> en <strong>${companyName}</strong>. En esta ocasión no fuiste seleccionado(a), pero valoramos mucho tu tiempo e interés.`
      : `Tu proceso para <strong>${jobTitle}</strong> en <strong>${companyName}</strong> cambió de estado.`;
    const footer = isHired
      ? "Te deseamos muchos éxitos en esta nueva etapa profesional."
      : isRejected
      ? "Te animamos a seguir postulando en Joblify. Nuevas oportunidades te esperan."
      : "Revisa tu panel de aplicaciones para ver el detalle actualizado.";
    const subject = isHired
      ? `¡Felicidades! Fuiste seleccionado(a): ${jobTitle}`
      : isRejected
      ? `Resultado de tu postulación: ${jobTitle}`
      : `Actualización de estado: ${jobTitle}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0071E3 0%, #0051BA 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${heading}</h1>
        </div>
        <div style="padding: 40px 20px; background: #f5f5f7;">
          <p style="color: #1d1d1f; font-size: 16px; margin: 0 0 20px 0;">Hola ${name || ""},</p>
          <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
            ${summary}
          </p>
          <div style="background: white; border: 1px solid #e5e5ea; border-radius: 12px; padding: 16px; margin: 0 0 22px 0; text-align:center;">
            <span style="font-size: 20px; font-weight: 700; color: #0071E3;">${readableStatus}</span>
          </div>
          <p style="color: #6e6e73; font-size: 13px; line-height: 1.6; margin: 0;">
            ${footer}
          </p>
        </div>
      </div>
    `;

    try {
      await sendWithFallback({
        to: email,
        subject,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Error enviando email de estado de aplicación:", error);
      throw new Error("No se pudo enviar el email de estado");
    }
  },

  async sendInterviewScheduledEmail(params: {
    email: string;
    name: string;
    jobTitle: string;
    companyName: string;
    mode: "REMOTO" | "PRESENCIAL";
    scheduledAt: string;
    timezone?: string;
    location?: string;
    meetingLink?: string;
    notes?: string;
    companyLogoUrl?: string;
  }) {
    const {
      email,
      name,
      jobTitle,
      companyName,
      mode,
      scheduledAt,
      timezone,
      location,
      meetingLink,
      notes,
      companyLogoUrl,
    } = params;

    const modeLabel = mode === "REMOTO" ? "Remota" : "Presencial";
    const whenText = new Date(scheduledAt).toLocaleString("es-CO", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone || "America/Bogota",
    });

    const placeBlock =
      mode === "PRESENCIAL"
        ? `<p style="margin: 0 0 8px 0; color: #1d1d1f; font-size: 14px;"><strong>Dirección:</strong> ${location || "Por confirmar"}</p>`
        : `<p style="margin: 0 0 8px 0; color: #1d1d1f; font-size: 14px;"><strong>Link de reunión:</strong> ${meetingLink ? `<a href="${meetingLink}" style="color:#0071E3;text-decoration:none;">Unirse a la entrevista</a>` : "Por confirmar"}</p>`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0071E3 0%, #0051BA 100%); padding: 28px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="${companyName}" style="height: 40px; max-width: 160px; object-fit: contain; margin-bottom: 12px;" />` : ""}
          <h1 style="color: white; margin: 0; font-size: 26px;">Entrevista programada</h1>
        </div>
        <div style="padding: 32px 20px; background: #f5f5f7;">
          <p style="color: #1d1d1f; font-size: 16px; margin: 0 0 16px 0;">Hola ${name || ""},</p>
          <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
            ${companyName} te invitó a una entrevista para la vacante <strong>${jobTitle}</strong>.
          </p>
          <div style="background: white; border: 1px solid #e5e5ea; border-radius: 12px; padding: 16px; margin: 0 0 18px 0;">
            <p style="margin: 0 0 8px 0; color: #1d1d1f; font-size: 14px;"><strong>Modalidad:</strong> ${modeLabel}</p>
            <p style="margin: 0 0 8px 0; color: #1d1d1f; font-size: 14px;"><strong>Fecha y hora:</strong> ${whenText}</p>
            <p style="margin: 0 0 8px 0; color: #1d1d1f; font-size: 14px;"><strong>Zona horaria:</strong> ${timezone || "America/Bogota"}</p>
            ${placeBlock}
            ${notes ? `<p style="margin: 0; color: #1d1d1f; font-size: 14px;"><strong>Notas:</strong> ${notes}</p>` : ""}
          </div>
          <p style="color: #6e6e73; font-size: 13px; line-height: 1.6; margin: 0;">
            También puedes revisar esta actualización desde tu panel de postulaciones en Joblify.
          </p>
        </div>
      </div>
    `;

    try {
      await sendWithFallback({
        to: email,
        subject: `Entrevista programada: ${jobTitle}`,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Error enviando email de entrevista:", error);
      throw new Error("No se pudo enviar el email de entrevista");
    }
  },

  async sendJobClosedNotSelectedEmail(
    email: string,
    name: string,
    jobTitle: string,
    companyName: string,
  ) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0071E3 0%, #0051BA 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Cierre del proceso</h1>
        </div>
        <div style="padding: 40px 20px; background: #f5f5f7;">
          <p style="color: #1d1d1f; font-size: 16px; margin: 0 0 20px 0;">Hola ${name || ""},</p>
          <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
            El proceso para la vacante <strong>${jobTitle}</strong> en <strong>${companyName}</strong> ha finalizado y en esta ocasión no fuiste seleccionado.
          </p>
          <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0;">
            Gracias por tu interés. Te recomendamos continuar postulando a nuevas oportunidades dentro de Joblify.
          </p>
        </div>
      </div>
    `;

    try {
      await sendWithFallback({
        to: email,
        subject: `Resultado de tu postulación: ${jobTitle}`,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Error enviando email de cierre de vacante:", error);
      throw new Error("No se pudo enviar el email de cierre");
    }
  },
};

export default emailService;
