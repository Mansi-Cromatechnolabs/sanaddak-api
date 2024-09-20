export const MailConfig = () => {
    let transporterOptions = null;

    if (process.env.MAIL_SECURE === 'true') {
        transporterOptions = {
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT, 10),
            service: process.env.MAIL_SERVICE,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
            secure:process.env.MAIL_SECURE
        };
    } else {
        transporterOptions = {
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT, 10),
            secure: process.env.MAIL_SECURE === 'true',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
        };
    }

    return transporterOptions;
};
