import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Simple in-memory rate limit store (IP -> timestamp)
const rateLimit = new Map<string, number>();

export async function POST(req: Request) {
    try {
        const { name, email, message, company } = await req.json();

        // 1. HONEYPOT CHECK
        // If the hidden 'company' field is filled, it's likely a bot. 
        // Return success to trick them, or error.
        if (company) {
            return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
        }

        // 2. RATE LIMITING (Basic)
        // In production (Vercel), you'd use 'x-forwarded-for'. Localhost is '::1' or '127.0.0.1'.
        // Allow 1 request every 60 seconds per IP.
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        const lastRequestTime = rateLimit.get(ip);

        if (lastRequestTime && (now - lastRequestTime < 60 * 1000)) {
            return NextResponse.json(
                { error: 'Too many requests. Please wait a minute before sending again.' },
                { status: 429 }
            );
        }
        rateLimit.set(ip, now);

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required.' },
                { status: 400 }
            );
        }

        // Create a transporter using SMTP
        // NOTE: You must set EMAIL_USER and EMAIL_PASS in your .env.local file
        // For Gmail, use an App Password, not your login password.

        // CRITICAL FIX: Remove spaces from the app password if the user pasted it directly from Google
        const rawPass = process.env.EMAIL_PASS || '';
        const cleanPass = rawPass.replace(/\s+/g, '');

        console.log(`Attempting to send email via: ${process.env.EMAIL_USER}`);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: cleanPass,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: process.env.EMAIL_USER,   // List of receivers (sending to self)
            replyTo: email,               // Reply to the user's email
            subject: `New Contact Form Submission from ${name}`,
            text: `
        Name: ${name}
        Email: ${email}
        
        Message:
        ${message}
      `,
            html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
        };

        // Verify connection configuration
        await new Promise((resolve, reject) => {
            transporter.verify(function (error, success) {
                if (error) {
                    console.error('Transporter verification failed:', error);
                    reject(error);
                } else {
                    console.log('Server is ready to take our messages');
                    resolve(success);
                }
            });
        });

        await transporter.sendMail(mailOptions);

        return NextResponse.json(
            { message: 'Email sent successfully!' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error sending email:', error);
        // Return the specific error message to the client
        return NextResponse.json(
            { error: error.message || 'Failed to send email.' },
            { status: 500 }
        );
    }
}
