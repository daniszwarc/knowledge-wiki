import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationCode(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: `"APiWiki" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your APiWiki login code",
    text: `Your login code is: ${code}. It expires in 10 minutes. If you did not request this, please ignore this email.`,
  });
}
