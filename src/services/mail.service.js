import nodemailer from 'nodemailer';

let transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587, // upgrade later with STARTTLS
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const check = async () => {
  await transport.verify();
};

const send = async ({ to, subject, text }) => {
  const message = { from: process.env.SMTP_DEFAULT_SENDER, to, subject, text };
  await transport.sendMail(message);
};

export default {
  send,
  check,
};
