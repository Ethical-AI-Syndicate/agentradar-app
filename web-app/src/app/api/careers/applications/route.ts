import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/careers/applications - Submit job application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobId,
      firstName,
      lastName,
      email,
      phone,
      linkedinUrl,
      portfolioUrl,
      resumeUrl,
      coverLetter,
      experience,
      availability,
      salaryExpectations,
      willingToRelocate = false,
      source = 'website'
    } = body;

    // Validate required fields
    if (!jobId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          message: 'Job ID, first name, last name, and email are required'
        },
        { status: 400 }
      );
    }

    // Verify job posting exists and is active
    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        status: 'ACTIVE',
        isPublished: true
      }
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found or no longer accepting applications' },
        { status: 404 }
      );
    }

    // Check if application deadline has passed
    if (jobPosting.applicationDeadline && new Date() > jobPosting.applicationDeadline) {
      return NextResponse.json(
        { error: 'Application deadline has passed' },
        { status: 400 }
      );
    }

    // Check for duplicate applications
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobId,
        email: email.toLowerCase().trim()
      }
    });

    if (existingApplication) {
      return NextResponse.json(
        { 
          error: 'Application already submitted',
          message: 'You have already applied for this position. We will review your application and get back to you.'
        },
        { status: 409 }
      );
    }

    // Create job application
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        linkedinUrl: linkedinUrl?.trim() || null,
        portfolioUrl: portfolioUrl?.trim() || null,
        resumeUrl: resumeUrl?.trim() || null,
        coverLetter: coverLetter?.trim() || null,
        experience: experience || null,
        availability: availability?.trim() || null,
        salaryExpectations: salaryExpectations?.trim() || null,
        willingToRelocate,
        source,
        status: 'RECEIVED',
        applicationDate: new Date()
      },
      include: {
        job: {
          select: {
            title: true,
            department: true
          }
        }
      }
    });

    // TODO: Send confirmation email to applicant
    console.log('Application confirmation to be sent:', {
      to: application.email,
      subject: `Application Received - ${application.job.title}`,
      applicantName: `${application.firstName} ${application.lastName}`,
      jobTitle: application.job.title,
      department: application.job.department
    });

    // TODO: Send notification email to HR
    console.log('HR notification to be sent:', {
      to: 'hr@agentradar.app',
      subject: `New Application - ${application.job.title}`,
      applicantName: `${application.firstName} ${application.lastName}`,
      jobTitle: application.job.title,
      applicationId: application.id
    });

    return NextResponse.json(
      { 
        success: true,
        applicationId: application.id,
        message: 'Application submitted successfully. We will review your application and get back to you within 5 business days.'
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Job application submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}