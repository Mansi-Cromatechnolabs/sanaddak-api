import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID; // Your Twilio Verify Service ID

const client = new Twilio(accountSid, authToken);

export async function createVerification(channel: 'email' | 'sms', to: string) {
    try {
        const verification = await client.verify.v2.services(serviceId)
            .verifications.create({ channel, to });

        return { message: 'OTP sent successfully', status: "success", sid: verification.sid };
    } catch (error) {
        console.error('Error creating verification:', error);
        return { message: 'Failed to send OTP', status: "error", error: error.message };
    }
}

export async function checkVerification(code: string, to: string) {
    try {
        const verificationCheck = await client.verify.v2.services(serviceId)
            .verificationChecks.create({ code, to });

        if (verificationCheck.status !== "approved") {
            return { message: 'Invalid OTP', status: "failed" };
        }

        return { message: 'OTP verified successfully', status: "success", sid: verificationCheck.sid };
    } catch (error) {
        console.error('Error checking verification:', error);
        return { message: 'Failed to verify OTP', status: "error", error: error.message };
    }
}
