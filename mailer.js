const nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
require('dotenv').config();

const transporter = nodemailer.createTransport(smtpTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD
  }
}));

async function sendEmail(email, subject, html) {
  return await new Promise((resolve, reject) => {
    const options = {
      from: `Famous Roleplay <${process.env.USER_EMAIL}>`,
      to: email,
      subject,
      html
    };
    
    transporter.sendMail(options, (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
}

module.exports = sendEmail;