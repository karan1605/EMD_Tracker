import { Resend } from 'resend';

// NOTE: In a production environment, this should be handled on the server side
// to keep the API key secure. This is a frontend implementation for demonstration.
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY || 're_placeholder');

export const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Auth <onboarding@resend.dev>',
      to: [email],
      subject: 'Your Login OTP - EMD Tracker',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>EMD Tracker Pro</h2>
          <p>Your verification code for login is:</p>
          <h1 style="color: #4f46e5; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error Details:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'Failed to send email');
    }

    return data;
  } catch (err: any) {
    console.error('Fatal Resend Service Error:', err);
    throw new Error(err.message || 'Connection to Resend failed');
  }
};
