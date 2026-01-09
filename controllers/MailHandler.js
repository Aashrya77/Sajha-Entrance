import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const MailHandler = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});