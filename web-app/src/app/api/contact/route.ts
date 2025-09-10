import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email service integration (you would configure this with SendGrid, Mailgun, etc.)
async function sendEmailNotification(contactData: Record<string, any>) {
  // For now, we'll log the email that would be sent
  console.log('Email notification to be sent:', {
    to: 'admin@agentradar.app',
    subject: `New Contact Form Submission from ${contactData.name}`,
    body: `
      New contact form submission:
      
      Name: ${contactData.name}
      Email: ${contactData.email}
      Company: ${contactData.company || 'Not provided'}
      Phone: ${contactData.phone || 'Not provided'}
      Subject: ${contactData.subject || 'No subject'}
      
      Message:
      ${contactData.message}
      
      Submitted at: ${new Date().toISOString()}
    `
  });

  // Auto-reply to user
  console.log('Auto-reply to be sent:', {
    to: contactData.email,
    subject: 'Thank you for contacting AgentRadar',
    body: `
      Hi ${contactData.name},
      
      Thank you for reaching out to AgentRadar. We've received your message and will get back to you within 24 hours.
      
      Your message:
      ${contactData.message}
      
      Best regards,
      The AgentRadar Team
    `
  });

  // TODO: Implement actual email sending with configured service
  // Example with SendGrid:
  // await sgMail.send({
  //   to: 'admin@agentradar.app',
  //   from: 'noreply@agentradar.app',
  //   subject: `New Contact Form Submission from ${contactData.name}`,
  //   text: emailBody,
  //   html: htmlEmailBody
  // });
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, phone, subject, message, contactMethod } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          message: 'Name, email, and message are required'
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        },
        { status: 400 }
      );
    }

    // Save to database
    const contactSubmission = await prisma.contactSubmission.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        subject: subject?.trim() || null,
        message: message.trim(),
        contactMethod: contactMethod?.trim() || null,
        status: 'NEW'
      }
    });

    // Send email notifications
    try {
      await sendEmailNotification({
        name,
        email,
        company,
        phone,
        subject,
        message
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails - contact is still saved
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true,
        message: 'Thank you for your message. We will get back to you within 24 hours.',
        submissionId: contactSubmission.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Contact form submission error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'We encountered an error processing your request. Please try again.'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint for admin to retrieve contact submissions
export async function GET(request: NextRequest) {
  try {
    // Basic admin check - in production you'd want proper authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const [submissions, totalCount] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.contactSubmission.count({ where })
    ]);

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Contact submissions retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}