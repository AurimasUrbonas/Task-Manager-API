const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'wpepsi@gmail.com',
    subject: 'Thanks for joining!',
    text: `Welcome to the app ${name}! Let me know how you get along with the app!`
  });
}

const sendCancelEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'wpepsi@gmail.com',
    subject: 'We hope you had a great time!',
    text: `Before you go ${name}, could you tell us why you left?`
  });
}

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail
};