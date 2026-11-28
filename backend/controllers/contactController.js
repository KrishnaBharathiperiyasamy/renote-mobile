import nodemailer from "nodemailer";

export const sendContactMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) 
    return res.status(400).json({ message: "All fields are required" });

  try {
    const host = process.env.SMTP_HOST || "smtp.titan.email";
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE !== undefined ? String(process.env.SMTP_SECURE) === "true" : port === 465;
    const fromName = process.env.SMTP_FROM_NAME || name;
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, 
      },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: process.env.RECEIVER_EMAIL, 
      subject: `📩 New Contact Form: ${subject}`,
      text: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
      `,
      replyTo: email,
    });

    return res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error sending message", error });
  }
};
