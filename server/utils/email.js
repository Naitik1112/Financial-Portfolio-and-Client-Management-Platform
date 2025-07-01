const nodemailer = require('nodemailer');
const fs = require('fs');

// Configure your email service (example for Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmailWithPDF = async (
  email,
  subject,
  description,
  pdfPath,
  title
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: subject,
      text: description,
      attachments: [
        {
          filename: title || 'report.xlsx',
          path: pdfPath
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendEmailWithPDF };
