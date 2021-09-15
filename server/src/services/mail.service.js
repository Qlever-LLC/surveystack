import nodemailer from 'nodemailer';

import dotenv from 'dotenv-defaults';
dotenv.config();

let transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const check = async () => {
  console.log(transport);
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
