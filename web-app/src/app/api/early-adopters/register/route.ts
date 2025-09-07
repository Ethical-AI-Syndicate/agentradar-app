import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { 
      firstName, 
      lastName, 
      email, 
      phone,
      brokerageName,
      businessType,
      yearsExperience,
      currentListings,
      averageListingPrice,
      targetMarkets,
      currentChallenges,
      preferredCommunication,
      bestContactTime,
      agreeToTerms
    } = body;

    if (!firstName || !lastName || !email || !agreeToTerms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingToken = await prisma.earlyAdopterToken.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingToken) {
      return NextResponse.json(
        { error: 'Email already registered for early adopter program' },
        { status: 409 }
      );
    }

    // Create early adopter token (mapping new form fields to existing schema)
    const token = await prisma.earlyAdopterToken.create({
      data: {
        id: uuidv4(),
        email: email.toLowerCase(),
        token: uuidv4(),
        firstName,
        lastName,
        phone: phone || '',
        company: brokerageName || '', // Map brokerageName to company
        location: `${businessType || 'Real Estate'}`, // Map businessType to location temporarily
        teamSize: yearsExperience || '', // Map yearsExperience to teamSize  
        monthlyDeals: currentListings || '', // Map currentListings to monthlyDeals
        primaryFocus: Array.isArray(targetMarkets) ? targetMarkets.join(', ') : '', // Map targetMarkets to primaryFocus
        currentChallenges: Array.isArray(currentChallenges) ? currentChallenges : [],
        techComfort: `${preferredCommunication || ''} - ${bestContactTime || ''}`, // Combine communication prefs
        isUsed: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    // TODO: Send welcome email with early adopter benefits
    // TODO: Add to marketing automation system
    
    return NextResponse.json({
      success: true,
      message: 'Successfully registered for early adopter program',
      tokenId: token.id
    });

  } catch (error) {
    console.error('Early adopter registration error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}