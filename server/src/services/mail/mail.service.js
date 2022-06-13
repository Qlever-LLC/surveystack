import nodemailer from 'nodemailer';
import sanitizeHtml from 'sanitize-html';

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

/**
 * Sends a simple action-link email in html and text format
 */
const sendLink = async ({
  to,
  subject,
  link,
  // text above the button in html format
  actionDescriptionHtml,
  // text before the link in text format
  actionDescriptionText,
  btnText,
  greeting = 'Hi there,',
}) => {
  // remove all html tags
  const s = (text) => sanitizeHtml(text, { allowedTags: [] });
  const btnColor = "#225034";

  await transport.sendMail({
    from: process.env.SMTP_DEFAULT_SENDER,
    to,
    subject,
    // Note: Basic html email. We should probably use some templating engine if we decide to create more complicated emails
    html: `
      <table style="max-width: 600px; margin: 0 auto;"width="100%; font-size: 17px;" border="0" cellspacing="0" cellpadding="0">
          <tr>
              <td align="center">
                <img style="width:80px;" src="cid:logo"/>
              </td>
          </tr>
          <tr>
              <td style="background-color: #f9f9f9; border-radius: 7px; padding: 32px">
                <h3>${s(greeting)}</h3>
                <table style="width:100%;margin-bottom:32px"><tbody>
                <tr><td style="text-align:center">
                  <h2>${s(actionDescriptionHtml)}</h2>
                  <a href="${s(
                    link
                  )}" style="color: white; font-weight: bold; text-decoration: none; word-break: break-word; font-size: 17px; line-height: 24px; background-color: ${btnColor}; letter-spacing: 1px; min-width: 80px; text-align: center; border-radius: 4px; padding: 10px 22px; font-family: 'Roboto', sans-serif;" target="_blank">
                  ${s(btnText)}
                  </a>
                </td></tr>
                <tr><td align="center" style="padding-top: 32px">
                  <small style="padding-top:18px">Alternatively, you can follow this link: ${s(
                    link
                  )}</small>
                </td></tr>
                </tbody></table>
              </td>
          </tr>
      </table>`,
    attachments: [
      {
        filename: 'logo.png',
        path: `${__dirname}/assets/logo.png`,
        cid: 'logo',
      },
    ],
    text: `${greeting}

    ${actionDescriptionText}
    ${link}`,
  });
};

export default {
  transport,
  send,
  sendLink,
  check,
};
