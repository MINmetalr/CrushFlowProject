"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodemailerService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
class NodemailerService {
    transporter;
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: env_1.env.SMTP_HOST,
            port: env_1.env.SMTP_PORT,
            secure: env_1.env.SMTP_SECURE,
            auth: {
                user: env_1.env.SMTP_USER,
                pass: env_1.env.SMTP_PASS,
            },
        });
    }
    async enviarCorreo(datos) {
        try {
            const info = await this.transporter.sendMail({
                from: env_1.env.EMAIL_FROM,
                to: Array.isArray(datos.to) ? datos.to.join(', ') : datos.to,
                subject: datos.subject,
                html: datos.html,
                attachments: datos.attachments,
            });
            logger_1.logger.info({ messageId: info.messageId }, 'Correo enviado exitosamente');
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Error al enviar correo');
            // Manejo seguro de error desconocido
            if (error instanceof Error) {
                throw new Error(`No se pudo enviar el correo: ${error.message}`);
            }
            throw new Error('No se pudo enviar el correo: error desconocido');
        }
    }
}
exports.NodemailerService = NodemailerService;
