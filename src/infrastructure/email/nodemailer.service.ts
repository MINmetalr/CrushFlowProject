import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { EmailService, DatosCorreo } from '../../application/ports/email.service';
import { logger } from '../../utils/logger';

export class NodemailerService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async enviarCorreo(datos: DatosCorreo): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: Array.isArray(datos.to) ? datos.to.join(', ') : datos.to,
        subject: datos.subject,
        html: datos.html,
        attachments: datos.attachments,
      });
      logger.info({ messageId: info.messageId }, 'Correo enviado exitosamente');
    } catch (error) {
      logger.error({ error }, 'Error al enviar correo');
      // Manejo seguro de error desconocido
      if (error instanceof Error) {
        throw new Error(`No se pudo enviar el correo: ${error.message}`);
      }
      throw new Error('No se pudo enviar el correo: error desconocido');
    }
  }
}