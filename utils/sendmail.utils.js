// Nodemailer module ko import kar rahe hain
import nodemailer from "nodemailer";

// Ek reusable function define kar rahe hain jo kisi bhi user ko email bhej sakta hai
const sendEmail = async function (email, subject, message) {
  // ✅ Transporter banate hain — iske through hum SMTP (mail server) se connect karenge
  // Yeh transporter SMTP config ke basis par email send karega
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // SMTP server ka address (e.g., smtp.gmail.com)
    port: process.env.SMTP_PORT, // Port number (465 for secure, 587 for TLS)
    secure: false, // secure true hoga toh SSL use karega (465); false hone par TLS (587)

    auth: {
      user: process.env.SMTP_USERNAME, // Email address jisse mail bhejna hai
      pass: process.env.SMTP_PASSWORD, // Us email ka password ya app-specific password (agar 2FA on hai)
    },
  });

  // ✅ Ab mail bhejne ke liye transporter.sendMail() use karte hain
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL, // From field — kis email se bhejna hai
    to: email, // To field — jise email bhejna hai (function ka pehla argument)
    subject: subject, // Subject line of the email
    html: message, // Email ka HTML content (body) — isme aap styling bhi kar sakte ho
  });
};

// Function ko export kar rahe hain taaki kisi bhi controller me import karke use kiya ja sake
export default sendEmail;
