import { NextRequest, NextResponse } from 'next/server';

interface DemoRequest {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  brokerageSize: string;
  currentChallenges?: string;
  demoDate?: string;
  requestedAt: string;
  status: string;
  assignedSalesRep: string;
  priority: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyName,
      contactName,
      email,
      phone,
      brokerageSize,
      currentChallenges,
      demoDate
    } = body;

    // Validate required fields
    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, contactName, and email are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // In a real implementation, this would:
    // 1. Save to database
    // 2. Send notification to sales team
    // 3. Schedule demo in calendar system
    // 4. Send confirmation email to prospect

    const demoRequest = {
      id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyName,
      contactName,
      email,
      phone,
      brokerageSize,
      currentChallenges,
      demoDate,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      assignedSalesRep: assignSalesRep(brokerageSize),
      priority: calculatePriority(brokerageSize, currentChallenges)
    };

    // Log the demo request (in production, this would go to a proper logging system)
    console.log('Enterprise Demo Request:', demoRequest);

    // Send notification to sales team (mock implementation)
    await notifySalesTeam(demoRequest);

    // Send confirmation email to prospect (mock implementation)
    await sendConfirmationEmail(demoRequest);

    return NextResponse.json({
      success: true,
      message: 'Demo request submitted successfully',
      data: {
        requestId: demoRequest.id,
        assignedSalesRep: demoRequest.assignedSalesRep,
        expectedResponse: '24 hours',
        nextSteps: [
          'Our sales team will review your request',
          'You will receive a calendar invite within 24 hours',
          'Demo will be customized based on your challenges',
          'Follow-up materials will be provided after the demo'
        ]
      }
    });

  } catch (error) {
    console.error('Demo request error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing demo request' },
      { status: 500 }
    );
  }
}

function assignSalesRep(brokerageSize: string): string {
  // Simple assignment logic based on brokerage size
  if (brokerageSize?.toLowerCase().includes('50+') || brokerageSize?.toLowerCase().includes('enterprise')) {
    return 'Sarah Chen - Enterprise Sales Director';
  } else {
    return 'Michael Rodriguez - Solutions Architect';
  }
}

function calculatePriority(brokerageSize: string, challenges: string): 'high' | 'medium' | 'low' {
  // Priority calculation based on brokerage size and challenges
  const size = brokerageSize?.toLowerCase() || '';
  const challengesText = challenges?.toLowerCase() || '';

  if (
    size.includes('50+') || 
    size.includes('enterprise') ||
    challengesText.includes('urgent') ||
    challengesText.includes('competitor') ||
    challengesText.includes('losing deals')
  ) {
    return 'high';
  } else if (
    size.includes('20') ||
    size.includes('30') ||
    challengesText.includes('growth') ||
    challengesText.includes('scaling')
  ) {
    return 'medium';
  } else {
    return 'low';
  }
}

async function notifySalesTeam(demoRequest: DemoRequest): Promise<void> {
  // Mock implementation - in production, this would:
  // 1. Send Slack notification
  // 2. Create lead in CRM
  // 3. Send email to sales team
  // 4. Add to sales queue/pipeline

  console.log('Notifying sales team:', {
    type: 'ENTERPRISE_DEMO_REQUEST',
    priority: demoRequest.priority,
    company: demoRequest.companyName,
    contact: demoRequest.contactName,
    assignedTo: demoRequest.assignedSalesRep
  });

  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function sendConfirmationEmail(demoRequest: DemoRequest): Promise<void> {
  // Mock implementation - in production, this would:
  // 1. Use email service (SendGrid, SES, etc.)
  // 2. Send branded confirmation email
  // 3. Include demo preparation materials
  // 4. Add to email automation sequence

  const emailData = {
    to: demoRequest.email,
    subject: `AgentRadar Enterprise Demo Request Confirmed - ${demoRequest.companyName}`,
    template: 'enterprise-demo-confirmation',
    data: {
      contactName: demoRequest.contactName,
      companyName: demoRequest.companyName,
      requestId: demoRequest.id,
      assignedSalesRep: demoRequest.assignedSalesRep,
      demoPreparationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/demo-prep/${demoRequest.id}`
    }
  };

  console.log('Sending confirmation email:', emailData);

  // Simulate async email operation
  await new Promise(resolve => setTimeout(resolve, 200));
}

export async function GET(request: NextRequest) {
  // This endpoint could be used to retrieve demo request status
  const searchParams = request.nextUrl.searchParams;
  const requestId = searchParams.get('id');

  if (!requestId) {
    return NextResponse.json(
      { error: 'Request ID is required' },
      { status: 400 }
    );
  }

  // Mock demo request status
  const mockStatus = {
    id: requestId,
    status: 'scheduled',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    assignedSalesRep: 'Sarah Chen - Enterprise Sales Director',
    demoUrl: `https://agentradar.zoom.us/j/123456789`,
    preparationMaterials: [
      'AgentRadar Enterprise Overview',
      'ROI Calculator Worksheet',
      'Implementation Timeline',
      'Security & Compliance Checklist'
    ]
  };

  return NextResponse.json({
    success: true,
    data: mockStatus
  });
}