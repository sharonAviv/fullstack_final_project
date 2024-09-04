const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Create a test account
let transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: 'your.username@ethereal.email',
    pass: 'your-password'
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    // Send email
    let info = await transporter.sendMail({
      from: '"Your Store" <your.username@ethereal.email>',
      to: "your.username@ethereal.email",
      subject: "New Contact Form Submission",
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Phone:</strong> ${phone}</p>
             <p><strong>Message:</strong> ${message}</p>`
    });

    console.log("Message sent: %s", info.messageId);
    res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
    console.error('Error processing contact message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

module.exports = router;