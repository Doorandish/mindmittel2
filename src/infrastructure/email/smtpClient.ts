import nodemailer from 'nodemailer';

export interface SmtpMailPayload {
  from: string;
  replyTo?: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

type TestSmtpSender = (payload: SmtpMailPayload) => Promise<void>;

let testSmtpSender: TestSmtpSender | null = null;

/**
 * Allows automated Vitest suites to intercept outbound SMTP emails without hitting the live network.
 */
export function setSmtpSenderForTests(sender: TestSmtpSender | null): void {
  testSmtpSender = sender;
}

export function resolveSmtpConfigFromEnv(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim() || '587';
  const port = Number.parseInt(portRaw, 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ||
    'MindMittel Security <security@mindmittel.de>';

  if (!host || !user || !pass || !Number.isFinite(port) || port <= 0) {
    return null;
  }

  return { host, port, user, pass, from };
}

export function isSmtpConfigured(): boolean {
  return Boolean(testSmtpSender || resolveSmtpConfigFromEnv());
}

/**
 * Dispatches an outbound transactional email via Amazon SMTP (STARTTLS on port 587 or implicit TLS on 465).
 */
export async function sendSmtpEmail(payload: SmtpMailPayload): Promise<void> {
  if (testSmtpSender) {
    await testSmtpSender(payload);
    return;
  }

  const config = resolveSmtpConfigFromEnv();
  if (!config) {
    throw new Error(
      'SMTP email delivery is not configured (missing SMTP_HOST, SMTP_USER, or SMTP_PASS).'
    );
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port === 587,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    from: payload.from || config.from,
    replyTo: payload.replyTo,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}
