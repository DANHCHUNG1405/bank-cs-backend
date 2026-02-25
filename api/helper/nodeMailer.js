const nodemailer = require('nodemailer');

var sendEmail = async (email) => {
  try {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: `smtgroupvn@gmail.com`,
        pass: `ifer zfep ibkv thly`,
      }
    });
    await transporter.sendMail(email);
    return true;
  } catch (error) {
    throw error;
  }
}


module.exports = sendEmail;