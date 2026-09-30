import { env } from '../config/environment';

let atClient: any = null;
function getAtClient(): any {
  if (!atClient) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const at = require('africastalking');
    atClient = at({ apiKey: env.AT_API_KEY, username: env.AT_USERNAME });
  }
  return atClient;
}

export async function sendSms(phone: string, message: string): Promise<void> {
  if (!env.AT_API_KEY) {
    console.warn('AfroMessage not configured. SMS not sent:', message);
    return;
  }

  try {
    const client = getAtClient();
    const formatted = phone.startsWith('+') ? phone : `+251${phone}`;
    const response = await client.SMS.send({
      to: [formatted],
      message,
      from: env.AT_FROM,
    });
    console.log('AfroMessage sent to', formatted);
  } catch (error: any) {
    console.warn('AfroMessage unavailable (SMS skipped):', error?.code || error?.message);
  }
}

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  await sendSms(phone, `Your Naik verification code is: ${otp}. Valid for 5 minutes.`);
}

export async function sendPasswordResetSms(phone: string, otp: string): Promise<void> {
  await sendSms(phone, `Your Naik password reset code is: ${otp}. Valid for 15 minutes.`);
}
