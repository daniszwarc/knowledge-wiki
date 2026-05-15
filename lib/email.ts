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

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await transporter.sendMail({
    from: `"APiWiki" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset your APiWiki password",
    text: `You requested a password reset. Click the link below to set a new password. This link expires in 15 minutes.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
  });
}
