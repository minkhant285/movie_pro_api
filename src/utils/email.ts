import nodemailer from 'nodemailer';
import { envData } from './environment';

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: envData.email,
        pass: envData.email_pass,
    },
});

export const sendPasswordResetEmail = async (to: string, token: string) => {
    const resetLink = `http://localhost:4000/reset-password?token=${token}`;

    const mailOptions = {
        from: envData.email,
        to,
        subject: 'Password Reset',
        text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
    };

    console.log(await transporter.sendMail(mailOptions));
};
