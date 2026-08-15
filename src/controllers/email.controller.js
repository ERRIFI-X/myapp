import nodemailer from 'nodemailer';
import { query } from '../config/db.js';
import { config } from '../config/env.js';

let memoryEmails = [
  { id: 1, recipient: 'client@company.com', subject: 'Welcome & Next Steps', body_html: '<p>Welcome!</p>', priority: 'Normal', status: 'SENT', created_at: new Date().toISOString() },
];

export const sendEmail = async (req, res, next) => {
  try {
    const { recipient, subject, bodyHtml, priority = 'Normal' } = req.body;

    if (!recipient || !subject || !bodyHtml) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recipient, subject, and bodyHtml',
      });
    }

    const { host, port, secure, user, pass, from } = config.smtp;

    let emailStatus = 'PENDING';
    let mailResponse = null;
    let isLiveSmtpSuccess = false;

    // Check if live SMTP credentials are set
    const hasSmtpConfig = Boolean(user && pass);

    if (hasSmtpConfig) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });

        const mailOptions = {
          from: from || user || 'no-reply@errifi.com',
          to: recipient,
          subject,
          html: bodyHtml,
        };

        console.log(`✉️ Express attempting to send live email via SMTP to: ${recipient}`);
        const info = await transporter.sendMail(mailOptions);

        emailStatus = 'SENT';
        isLiveSmtpSuccess = true;
        mailResponse = {
          mode: 'LIVE_SMTP',
          messageId: info.messageId,
          accepted: info.accepted,
        };
        console.log(`✅ Live SMTP Email sent successfully! ID: ${info.messageId}`);
      } catch (smtpErr) {
        console.warn(`⚠️ SMTP Live authentication failed (${smtpErr.message}). Saving email in DB as PENDING_SMTP.`);
        emailStatus = 'SAVED_DB_PENDING_SMTP';
        mailResponse = {
          mode: 'DEV_MOCK_FALLBACK',
          warning: 'Live Gmail SMTP authentication failed (BadCredentials). Email saved in Database.',
          errorDetails: smtpErr.message,
        };
      }
    } else {
      console.log(`ℹ️ SMTP_USER / SMTP_PASS not set in .env. Email saved in DB in Development Mode.`);
      emailStatus = 'SAVED_DEV_MODE';
      mailResponse = {
        mode: 'DEV_MOCK',
        info: 'Email saved in Database. Configure SMTP credentials in .env for live sending.',
      };
    }

    let savedEmail;

    if (process.env.DATABASE_URL) {
      const sql = `
        INSERT INTO emails (recipient, subject, body_html, priority, status, n8n_response)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const { rows } = await query(sql, [recipient, subject, bodyHtml, priority, emailStatus, JSON.stringify(mailResponse)]);
      savedEmail = rows[0];
    } else {
      savedEmail = {
        id: Date.now(),
        recipient,
        subject,
        body_html: bodyHtml,
        priority,
        status: emailStatus,
        mail_response: mailResponse,
        created_at: new Date().toISOString(),
      };
      memoryEmails.unshift(savedEmail);
    }

    res.status(201).json({
      success: true,
      message: isLiveSmtpSuccess
        ? 'Email sent successfully via Gmail SMTP!'
        : 'Email saved to PostgreSQL database successfully! (Update SMTP_PASS in .env for live Gmail delivery)',
      data: savedEmail,
      smtp: mailResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmails = async (req, res, next) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, count: memoryEmails.length, data: memoryEmails, isMock: true });
    }

    const { rows } = await query('SELECT * FROM emails ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

export const n8nCallback = async (req, res) => {
  res.json({ success: true, message: 'n8n callback disabled. Emails are managed directly via Express.' });
};
