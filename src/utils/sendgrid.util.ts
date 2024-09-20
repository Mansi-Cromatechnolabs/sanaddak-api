const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = (to, subject, html) => {
    const msg = {
        to,
        from: process.env.SENDGRID_SENDER_EMAIL,
        subject,
        html,
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent successfully.');
        }, error => {
            console.error('Error sending email:', error);

            if (error.response) {
                console.error('Error response:', error.response.body);
            }
        });
};