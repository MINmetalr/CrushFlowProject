export interface DatosCorreo {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: any[];
}

export interface EmailService {
  enviarCorreo(datos: DatosCorreo): Promise<void>;
}