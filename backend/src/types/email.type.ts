
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls: {
    rejectUnauthorized: boolean;
  };
}


export interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}
