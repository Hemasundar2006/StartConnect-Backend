const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html = null) => {
    // Basic configuration using environment variables
    // For development, you might want to use Mailtrap or Ethereal
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html: html || text, // Use HTML if provided, otherwise use text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Helper function to create invitation email HTML
const createInvitationEmailHTML = (companyName, website, description, logo, invitationLink, inviterName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .company-info { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .logo { max-width: 150px; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Team Invitation</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p><strong>${inviterName}</strong> has invited you to join their team at <strong>${companyName}</strong> on StartConnect.</p>
                
                <div class="company-info">
                    <h2 style="margin-top: 0; color: #4CAF50;">${companyName}</h2>
                    ${logo ? `<img src="${logo}" alt="${companyName}" class="logo" />` : ''}
                    ${description ? `<p><strong>About:</strong> ${description}</p>` : ''}
                    <p><strong>Website:</strong> <a href="${website}" target="_blank">${website}</a></p>
                </div>
                
                <p>Click the button below to accept this invitation and join the team:</p>
                <div style="text-align: center;">
                    <a href="${invitationLink}" class="button">Accept Invitation</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${invitationLink}" style="color: #4CAF50; word-break: break-all;">${invitationLink}</a>
                </p>
                
                <p style="margin-top: 20px; color: #666;">
                    If you did not expect this invitation, you can safely ignore this email.
                </p>
            </div>
            <div class="footer">
                <p>This invitation was sent from StartConnect platform.</p>
                <p>&copy; ${new Date().getFullYear()} StartConnect. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Helper function to create welcome email HTML
const createWelcomeEmailHTML = (userName, userRole, verificationUrl) => {
    const roleSpecificContent = userRole === 'Startup' 
        ? `
            <p>As a <strong>Startup</strong> on StartConnect, you can:</p>
            <ul style="text-align: left; display: inline-block;">
                <li>Showcase your company and journey</li>
                <li>Connect with talented students</li>
                <li>Post opportunities and updates</li>
                <li>Build your team</li>
            </ul>
        `
        : `
            <p>As a <strong>Student</strong> on StartConnect, you can:</p>
            <ul style="text-align: left; display: inline-block;">
                <li>Complete your profile with skills and experience</li>
                <li>Discover exciting startup opportunities</li>
                <li>Connect with innovative companies</li>
                <li>Build your professional network</li>
            </ul>
        `;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .welcome-box { background-color: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .button:hover { opacity: 0.9; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
            .features { background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
            ul { padding-left: 20px; }
            li { margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Welcome to StartConnect! 🎉</h1>
            </div>
            <div class="content">
                <div class="welcome-box">
                    <h2 style="color: #667eea; margin-top: 0;">Hello ${userName}!</h2>
                    <p>We're thrilled to have you join the StartConnect community! Your account has been successfully created.</p>
                    
                    <div class="features">
                        ${roleSpecificContent}
                    </div>
                    
                    <p><strong>Next Step:</strong> Please verify your email address to get started and unlock all features.</p>
                    
                    <div style="text-align: center;">
                        <a href="${verificationUrl}" class="button">Verify Email Address</a>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Or copy and paste this link into your browser:<br>
                        <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
                    </p>
                    
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">
                        If you have any questions or need assistance, feel free to reach out to our support team. We're here to help!
                    </p>
                </div>
            </div>
            <div class="footer">
                <p><strong>StartConnect</strong> - Connecting Students with Startups</p>
                <p>This email was sent to confirm your registration. If you didn't create this account, please ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} StartConnect. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = sendEmail;
module.exports.createInvitationEmailHTML = createInvitationEmailHTML;
module.exports.createWelcomeEmailHTML = createWelcomeEmailHTML;
