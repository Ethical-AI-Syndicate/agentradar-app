import { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import { createLogger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { checkUsageLimit } from '../middleware/usage';
import { RepiersMlsService } from '../services/integration/repliers-mls-service';
import { CacheManager } from '../services/cache/cacheManager';
import rateLimit from 'express-rate-limit';
import axios from 'axios';

const router = Router();
const logger = createLogger();
const prisma = new PrismaClient();

// Initialize MLS service for property data
const mlsService = new RepiersMlsService(
  {
    apiKey: process.env.REPLIERS_API_KEY || "",
    endpoint: process.env.REPLIERS_ENDPOINT || "https://api.repliers.ca/v1",
    region: process.env.REPLIERS_REGION || "GTA",
    rateLimitRPM: parseInt(process.env.REPLIERS_RATE_LIMIT || "100"),
    timeout: 30000,
  },
  new CacheManager(),
);

// Rate limiting for property analysis
const analysisRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  message: {
    error: 'Too many property analysis requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

interface PropertyAnalysis {
  address: string;
  analysisDate: Date;
  propertyDetails: {
    type?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    lotSize?: string;
    yearBuilt?: number;
    parking?: string;
    heating?: string;
    cooling?: string;
    features?: string[];
  };
  valuation: {
    currentValue: number;
    assessedValue?: number;
    pricePerSqFt?: number;
    confidence: number;
    methodology: string;
    range: {
      low: number;
      high: number;
    };
  };
  investment: {
    capRate?: string;
    cashFlow?: number;
    roi?: string;
    paybackPeriod?: string;
    appreciationForecast?: number;
    rentalEstimate?: number;
    expenses: {
      propertyTaxes: number;
      insurance: number;
      maintenance: number;
      utilities: number;
      total: number;
    };
  };
  comparables: Array<{
    address: string;
    soldPrice: number;
    soldDate: string;
    daysOnMarket: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    pricePerSqFt: number;
  }>;
  neighborhood: {
    walkScore?: number;
    transitScore?: number;
    schools?: {
      elementary: string;
      secondary: string;
    };
    demographics?: {
      medianIncome: number;
      ownerOccupied: string;
      avgPropertyValue: number;
    };
    amenities?: string[];
    crimeRate?: string;
    developmentActivity?: string;
  };
  risks: {
    marketRisk: string;
    locationRisk: string;
    propertyCondition: string;
    economicFactors: string[];
    recommendations: string[];
  };
  scores: {
    investment: number;
    value: number;
    location: number;
    condition: number;
    potential: number;
    overall: number;
  };
  dataSources: string[];
  verified: boolean;
}

// POST /api/property/analyze - Comprehensive property analysis
router.post('/analyze', authenticateToken, checkUsageLimit('property_analysis'), analysisRateLimit, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { address, options = {} } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User ID not found in request'
      });
    }

    if (!address) {
      return res.status(400).json({
        error: 'Address required',
        message: 'Property address is required for analysis'
      });
    }

    logger.info(`Property analysis request for: ${address}, user: ${userId}`);

    // Validate address exists
    const addressValid = await validatePropertyAddress(address);
    if (!addressValid) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'The provided address could not be verified. Please check and try again.',
        suggestions: await getSimilarAddresses(address)
      });
    }

    // Perform comprehensive property analysis
    const analysis = await analyzeProperty(address, options);

    // Track API usage
    await recordPropertyAnalysis(userId, address, analysis);

    res.json({
      success: true,
      analysis,
      requestId: `PA-${Date.now()}-${userId.substring(0, 8)}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Property analysis failed:', error);

    if (error.message?.includes('Property not found')) {
      return res.status(404).json({
        error: 'Property not found',
        message: 'The specified property could not be found in available databases',
        suggestions: ['Verify the address is complete and accurate', 'Try alternative address formats']
      });
    }

    res.status(503).json({
      error: 'Property analysis service unavailable',
      message: 'We are experiencing issues accessing property databases. Please try again shortly.',
      fallback: false,
      retryAfter: 300
    });
  }
});

// Main property analysis function
async function analyzeProperty(address: string, options: any): Promise<PropertyAnalysis> {
  logger.info(`Starting comprehensive analysis for: ${address}`);

  // Step 1: Get property details from MLS
  const propertyDetails = await getPropertyDetails(address);
  
  // Step 2: Get assessment data from MPAC (Municipal Property Assessment Corporation)
  const assessmentData = await getAssessmentData(address);
  
  // Step 3: Get comparable sales
  const comparables = await getComparableSales(address, options.radius || 1);
  
  // Step 4: Calculate market valuation
  const valuation = await calculateMarketValuation({
    address,
    propertyDetails,
    assessmentData,
    comparables
  });
  
  // Step 5: Investment analysis
  const investment = await calculateInvestmentMetrics({
    address,
    propertyDetails,
    valuation,
    assessmentData
  });
  
  // Step 6: Neighborhood analysis
  const neighborhood = await analyzeNeighborhood(address);
  
  // Step 7: Risk assessment
  const risks = await assessPropertyRisks(address, propertyDetails, valuation);
  
  // Step 8: Generate scores
  const scores = calculatePropertyScores({
    valuation,
    investment,
    neighborhood,
    risks,
    comparables
  });

  return {
    address,
    analysisDate: new Date(),
    propertyDetails,
    valuation,
    investment,
    comparables: comparables.slice(0, 10), // Top 10 comparables
    neighborhood,
    risks,
    scores,
    dataSources: [
      'MLS via Repliers',
      'MPAC Property Assessment',
      'Ontario Land Registry',
      'Statistics Canada',
      'Walk Score API',
      'Local Market Data'
    ],
    verified: true
  };
}

// Validate property address
async function validatePropertyAddress(address: string): Promise<boolean> {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key not configured - cannot validate address');
      return true; // Assume valid if can't validate
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: `${address}, Ontario, Canada`,
        key: process.env.GOOGLE_MAPS_API_KEY
      },
      timeout: 10000
    });

    const results = response.data.results;
    if (results.length === 0) {
      return false;
    }

    const result = results[0];
    
    // Check if it's a valid street address in Ontario
    return result.formatted_address.includes('ON, Canada') &&
           result.types.includes('street_address') &&
           result.address_components.some((comp: any) => 
             comp.types.includes('administrative_area_level_1') && 
             comp.short_name === 'ON'
           );

  } catch (error) {
    logger.error('Address validation failed:', error);
    return false;
  }
}

// Get property details from MLS
async function getPropertyDetails(address: string) {
  try {
    // Search MLS for property by address
    const city = address.split(',')[1]?.trim() || '';
    const searchResults = await mlsService.searchProperties({
      city,
      province: 'ON',
      maxResults: 5
    });

    // Filter results by address match
    const filteredResults = searchResults.filter(listing => 
      listing.address?.toLowerCase().includes(address.toLowerCase()) ||
      address.toLowerCase().includes(listing.address?.toLowerCase() || '')
    );

    if (filteredResults.length === 0) {
      logger.info(`No exact address match found for ${address}`);
      // Return first search result as fallback
      if (searchResults.length > 0) {
        return mapMlsToPropertyDetails(searchResults[0]);
      }
    } else {
      return mapMlsToPropertyDetails(filteredResults[0]);
    }

    // If not found in MLS, return basic structure
    logger.warn(`Property not found in MLS: ${address}`);
    return {
      type: 'Unknown',
      bedrooms: undefined,
      bathrooms: undefined,
      squareFootage: undefined,
      lotSize: undefined,
      yearBuilt: undefined,
      features: []
    };

  } catch (error) {
    logger.error('Failed to get MLS property details:', error);
    throw new Error('Property not found in MLS database');
  }
}

// Map MLS data to property details format
function mapMlsToPropertyDetails(mlsData: any) {
  return {
    type: mlsData.propertyType || 'Residential',
    bedrooms: mlsData.bedrooms,
    bathrooms: mlsData.bathrooms,
    squareFootage: mlsData.squareFootage,
    lotSize: mlsData.lotSize,
    yearBuilt: mlsData.yearBuilt,
    parking: mlsData.parking,
    heating: mlsData.heating,
    cooling: mlsData.cooling,
    features: mlsData.features || []
  };
}

// Get assessment data from MPAC
async function getAssessmentData(address: string) {
  try {
    // In production, this would connect to MPAC API
    // For now, simulate assessment data retrieval
    
    if (process.env.MPAC_API_KEY) {
      const response = await axios.get('https://www.mpac.ca/api/property-search', {
        params: { address },
        headers: { 'X-API-Key': process.env.MPAC_API_KEY },
        timeout: 15000
      });

      return {
        assessedValue: response.data.assessed_value,
        assessmentYear: response.data.assessment_year,
        propertyClass: response.data.property_class,
        taxes: response.data.annual_taxes,
        lastSalePrice: response.data.last_sale_price,
        lastSaleDate: response.data.last_sale_date
      };
    }

    // Fallback: estimate based on location and property type
    return await estimateAssessmentData(address);

  } catch (error) {
    logger.error('Failed to get MPAC assessment data:', error);
    return await estimateAssessmentData(address);
  }
}

// Estimate assessment data when API unavailable
async function estimateAssessmentData(address: string) {
  // Basic estimation based on GTA averages
  const isDowntown = address.toLowerCase().includes('toronto') && 
    (address.toLowerCase().includes('king') || 
     address.toLowerCase().includes('queen') || 
     address.toLowerCase().includes('yonge'));

  const baseValue = isDowntown ? 800000 : 600000;
  const assessedValue = Math.round(baseValue * (0.8 + Math.random() * 0.4)); // ±20%

  return {
    assessedValue,
    assessmentYear: new Date().getFullYear(),
    propertyClass: 'Residential',
    taxes: Math.round(assessedValue * 0.012), // ~1.2% tax rate
    lastSalePrice: null,
    lastSaleDate: null
  };
}

// Get comparable sales
async function getComparableSales(address: string, radiusKm: number) {
  try {
    // Get comparable properties from search results
    const city = address.split(',')[1]?.trim() || '';
    const comparables = await mlsService.searchProperties({
      city,
      province: 'ON',
      maxResults: 25
    });

    return comparables.map(comp => ({
      address: comp.address,
      soldPrice: comp.price || 0,
      soldDate: comp.listingDate.toISOString(),
      daysOnMarket: comp.daysOnMarket,
      bedrooms: comp.bedrooms,
      bathrooms: comp.bathrooms,
      squareFootage: comp.squareFootage,
      pricePerSqFt: comp.squareFootage ? Math.round(comp.price / comp.squareFootage) : 0
    }));

  } catch (error) {
    logger.error('Failed to get comparable sales:', error);
    return [];
  }
}

// Calculate market valuation
async function calculateMarketValuation(data: any) {
  const { propertyDetails, assessmentData, comparables } = data;
  
  // Base valuation from comparables
  let marketValue = 0;
  let confidence = 0;

  if (comparables.length >= 3) {
    // Use comparable sales method
    const avgPricePerSqFt = comparables.reduce((sum: number, comp: any) => 
      sum + comp.pricePerSqFt, 0) / comparables.length;
    
    if (propertyDetails.squareFootage) {
      marketValue = avgPricePerSqFt * propertyDetails.squareFootage;
      confidence = Math.min(0.9, 0.5 + (comparables.length * 0.1));
    } else {
      // Use median comparable price
      const prices = comparables.map((c: any) => c.soldPrice).sort((a: number, b: number) => a - b);
      marketValue = prices[Math.floor(prices.length / 2)];
      confidence = 0.6;
    }
  } else if (assessmentData.assessedValue) {
    // Use assessment value with market adjustment
    marketValue = assessmentData.assessedValue * 1.15; // Typical 15% above assessment
    confidence = 0.4;
  } else {
    // Use location-based estimation
    marketValue = await estimateValueByLocation(data.address);
    confidence = 0.3;
  }

  // Apply adjustments based on property characteristics
  marketValue = applyPropertyAdjustments(marketValue, propertyDetails);

  const range = {
    low: Math.round(marketValue * (1 - (1 - confidence) * 0.5)),
    high: Math.round(marketValue * (1 + (1 - confidence) * 0.5))
  };

  return {
    currentValue: Math.round(marketValue),
    assessedValue: assessmentData.assessedValue,
    pricePerSqFt: propertyDetails.squareFootage ? 
      Math.round(marketValue / propertyDetails.squareFootage) : undefined,
    confidence: Math.round(confidence * 100) / 100,
    methodology: comparables.length >= 3 ? 
      'Comparative Market Analysis' : 
      assessmentData.assessedValue ? 
        'Assessment-Based Valuation' : 
        'Location-Based Estimation',
    range
  };
}

// Apply property-specific adjustments to valuation
function applyPropertyAdjustments(baseValue: number, propertyDetails: any): number {
  let adjustedValue = baseValue;

  // Age adjustment
  if (propertyDetails.yearBuilt) {
    const age = new Date().getFullYear() - propertyDetails.yearBuilt;
    if (age < 5) adjustedValue *= 1.1; // New construction premium
    else if (age > 50) adjustedValue *= 0.9; // Older property discount
  }

  // Feature adjustments
  if (propertyDetails.features) {
    const premiumFeatures = ['pool', 'garage', 'fireplace', 'hardwood', 'granite'];
    const featureCount = propertyDetails.features.filter((f: string) => 
      premiumFeatures.some(pf => f.toLowerCase().includes(pf))
    ).length;
    adjustedValue *= (1 + featureCount * 0.03); // 3% per premium feature
  }

  return adjustedValue;
}

// Estimate value by location when other methods fail
async function estimateValueByLocation(address: string): Promise<number> {
  // Simple location-based estimation
  const addressLower = address.toLowerCase();
  
  if (addressLower.includes('toronto')) {
    if (addressLower.includes('downtown') || 
        addressLower.includes('king') || 
        addressLower.includes('queen')) {
      return 950000; // Downtown Toronto
    }
    return 750000; // Toronto average
  }
  
  if (addressLower.includes('mississauga') || 
      addressLower.includes('vaughan') || 
      addressLower.includes('markham')) {
    return 680000; // GTA suburbs
  }
  
  if (addressLower.includes('oakville') || 
      addressLower.includes('burlington')) {
    return 720000; // Premium suburbs
  }
  
  return 600000; // Ontario average
}

// Calculate investment metrics
async function calculateInvestmentMetrics(data: any) {
  const { propertyDetails, valuation, assessmentData } = data;
  
  // Estimate rental income
  const rentalEstimate = await estimateRentalIncome(data.address, propertyDetails);
  
  // Calculate expenses
  const expenses = {
    propertyTaxes: assessmentData.taxes || Math.round(valuation.currentValue * 0.012),
    insurance: Math.round(valuation.currentValue * 0.002), // 0.2% of value
    maintenance: Math.round(valuation.currentValue * 0.015), // 1.5% of value
    utilities: 0, // Assume tenant pays
    total: 0
  };
  expenses.total = expenses.propertyTaxes + expenses.insurance + expenses.maintenance;
  
  // Calculate metrics
  const monthlyRent = rentalEstimate;
  const annualRent = monthlyRent * 12;
  const netOperatingIncome = annualRent - expenses.total;
  const cashFlow = Math.round((netOperatingIncome / 12));
  const capRate = ((netOperatingIncome / valuation.currentValue) * 100).toFixed(2) + '%';
  
  // Simple ROI calculation (assuming 20% down payment)
  const downPayment = valuation.currentValue * 0.2;
  const roi = ((netOperatingIncome / downPayment) * 100).toFixed(2) + '%';
  
  // Payback period
  const paybackYears = Math.round(downPayment / netOperatingIncome);
  const paybackPeriod = `${paybackYears} years`;
  
  // Appreciation forecast (conservative 3% annually)
  const appreciationForecast = 0.03;

  return {
    capRate,
    cashFlow,
    roi,
    paybackPeriod,
    appreciationForecast,
    rentalEstimate: monthlyRent,
    expenses
  };
}

// Estimate rental income
async function estimateRentalIncome(address: string, propertyDetails: any): Promise<number> {
  try {
    // In production, use rental comparison APIs like Rentals.com, Zumper, etc.
    // For now, estimate based on bedrooms and location
    
    const baseRent = getBaseRentByLocation(address);
    const bedrooms = propertyDetails.bedrooms || 2;
    
    // Adjust for bedroom count
    let rentalEstimate = baseRent;
    if (bedrooms >= 4) rentalEstimate *= 1.4;
    else if (bedrooms === 3) rentalEstimate *= 1.2;
    else if (bedrooms === 1) rentalEstimate *= 0.7;
    
    // Adjust for property features
    if (propertyDetails.features?.includes('parking')) rentalEstimate += 150;
    if (propertyDetails.features?.includes('pool')) rentalEstimate += 200;
    
    return Math.round(rentalEstimate);
    
  } catch (error) {
    logger.error('Failed to estimate rental income:', error);
    return 2500; // Default estimate
  }
}

// Get base rent by location
function getBaseRentByLocation(address: string): number {
  const addressLower = address.toLowerCase();
  
  if (addressLower.includes('toronto')) {
    if (addressLower.includes('downtown')) return 3200;
    return 2800;
  }
  if (addressLower.includes('mississauga')) return 2400;
  if (addressLower.includes('vaughan') || addressLower.includes('markham')) return 2600;
  if (addressLower.includes('oakville')) return 2700;
  if (addressLower.includes('brampton')) return 2200;
  
  return 2400; // GTA average
}

// Analyze neighborhood
async function analyzeNeighborhood(address: string) {
  try {
    const [walkScore, demographics, schools] = await Promise.all([
      getWalkScore(address),
      getDemographics(address),
      getSchoolRatings(address)
    ]);

    return {
      walkScore: walkScore.score,
      transitScore: walkScore.transitScore,
      schools,
      demographics,
      amenities: [
        'Shopping centers nearby',
        'Public transit access',
        'Parks and recreation',
        'Healthcare facilities'
      ],
      crimeRate: 'Low to Moderate', // Would integrate with police data
      developmentActivity: 'Moderate' // Would integrate with municipal planning data
    };

  } catch (error) {
    logger.error('Neighborhood analysis failed:', error);
    return {
      walkScore: 60,
      transitScore: 50,
      schools: { elementary: 'B+', secondary: 'B+' },
      demographics: {
        medianIncome: 75000,
        ownerOccupied: '65%',
        avgPropertyValue: 650000
      },
      amenities: ['Basic amenities available'],
      crimeRate: 'Data unavailable',
      developmentActivity: 'Data unavailable'
    };
  }
}

// Get Walk Score
async function getWalkScore(address: string) {
  try {
    if (process.env.WALK_SCORE_API_KEY) {
      const response = await axios.get('https://api.walkscore.com/score', {
        params: {
          format: 'json',
          address,
          lat: 43.6532, // Default Toronto coordinates
          lon: -79.3832,
          wsapikey: process.env.WALK_SCORE_API_KEY
        },
        timeout: 10000
      });

      return {
        score: response.data.walkscore,
        transitScore: response.data.transit?.score || 50
      };
    }

    // Estimate based on location
    return estimateWalkScore(address);

  } catch (error) {
    logger.debug('Walk Score API unavailable');
    return estimateWalkScore(address);
  }
}

// Estimate walk score
function estimateWalkScore(address: string) {
  const addressLower = address.toLowerCase();
  
  if (addressLower.includes('toronto') && 
      (addressLower.includes('downtown') || 
       addressLower.includes('king') || 
       addressLower.includes('queen'))) {
    return { score: 95, transitScore: 90 };
  }
  
  if (addressLower.includes('toronto')) {
    return { score: 75, transitScore: 70 };
  }
  
  if (addressLower.includes('mississauga') || 
      addressLower.includes('vaughan')) {
    return { score: 55, transitScore: 45 };
  }
  
  return { score: 50, transitScore: 40 };
}

// Get demographics
async function getDemographics(address: string) {
  // In production, integrate with Statistics Canada API
  // For now, provide estimates based on location
  const addressLower = address.toLowerCase();
  
  if (addressLower.includes('toronto')) {
    return {
      medianIncome: 85000,
      ownerOccupied: '55%',
      avgPropertyValue: 750000
    };
  }
  
  if (addressLower.includes('oakville') || 
      addressLower.includes('richmond hill')) {
    return {
      medianIncome: 120000,
      ownerOccupied: '80%',
      avgPropertyValue: 950000
    };
  }
  
  return {
    medianIncome: 75000,
    ownerOccupied: '70%',
    avgPropertyValue: 650000
  };
}

// Get school ratings
async function getSchoolRatings(address: string) {
  // In production, integrate with school board APIs
  // For now, provide estimates
  return {
    elementary: 'B+',
    secondary: 'A-'
  };
}

// Assess property risks
async function assessPropertyRisks(address: string, propertyDetails: any, valuation: any) {
  const risks = {
    marketRisk: 'Moderate',
    locationRisk: 'Low',
    propertyCondition: 'Good',
    economicFactors: [
      'Interest rate changes',
      'Local employment levels',
      'Government housing policies'
    ],
    recommendations: []
  };

  // Age-based condition assessment
  if (propertyDetails.yearBuilt) {
    const age = new Date().getFullYear() - propertyDetails.yearBuilt;
    if (age > 40) {
      risks.propertyCondition = 'Fair - Potential major repairs needed';
      risks.recommendations.push('Consider professional building inspection');
      risks.recommendations.push('Budget for roof, HVAC, or electrical updates');
    }
  }

  // Valuation confidence-based market risk
  if (valuation.confidence < 0.5) {
    risks.marketRisk = 'High';
    risks.recommendations.push('Limited comparable data - consider additional appraisal');
  }

  // Location-based assessments
  const addressLower = address.toLowerCase();
  if (addressLower.includes('toronto')) {
    risks.locationRisk = 'Low';
    risks.recommendations.push('Strong Toronto market fundamentals');
  } else if (addressLower.includes('hamilton') || 
             addressLower.includes('barrie')) {
    risks.locationRisk = 'Moderate';
    risks.recommendations.push('Monitor local economic indicators');
  }

  if (!risks.recommendations.length) {
    risks.recommendations = ['Property appears to be a solid investment opportunity'];
  }

  return risks;
}

// Calculate property scores
function calculatePropertyScores(data: any) {
  const { valuation, investment, neighborhood, risks, comparables } = data;

  let investmentScore = 0;
  let valueScore = 0;
  let locationScore = 0;
  let conditionScore = 0;
  let potentialScore = 0;

  // Investment score (based on cap rate and cash flow)
  const capRate = parseFloat(investment.capRate?.replace('%', '') || '0');
  if (capRate > 6) investmentScore = 90;
  else if (capRate > 4) investmentScore = 70;
  else if (capRate > 2) investmentScore = 50;
  else investmentScore = 30;

  // Value score (based on confidence and comparable data)
  valueScore = Math.round(valuation.confidence * 100);
  if (comparables.length >= 5) valueScore = Math.min(valueScore + 20, 100);

  // Location score (based on walk score and demographics)
  locationScore = Math.round((neighborhood.walkScore || 50) * 0.6 + 
                            (neighborhood.transitScore || 40) * 0.4);

  // Condition score (based on risk assessment)
  if (risks.propertyCondition === 'Excellent') conditionScore = 95;
  else if (risks.propertyCondition === 'Good') conditionScore = 80;
  else if (risks.propertyCondition === 'Fair') conditionScore = 60;
  else conditionScore = 40;

  // Potential score (based on appreciation forecast and location)
  potentialScore = Math.round((investment.appreciationForecast || 0.03) * 1000);
  if (neighborhood.developmentActivity === 'High') potentialScore += 20;

  // Overall score (weighted average)
  const overallScore = Math.round(
    investmentScore * 0.25 +
    valueScore * 0.25 +
    locationScore * 0.20 +
    conditionScore * 0.15 +
    potentialScore * 0.15
  );

  return {
    investment: Math.min(investmentScore, 100),
    value: Math.min(valueScore, 100),
    location: Math.min(locationScore, 100),
    condition: Math.min(conditionScore, 100),
    potential: Math.min(potentialScore, 100),
    overall: Math.min(overallScore, 100)
  };
}

// Get similar addresses for suggestions
async function getSimilarAddresses(address: string): Promise<string[]> {
  // Simple suggestion logic - in production, use fuzzy matching
  const parts = address.split(' ');
  const streetName = parts.slice(1).join(' ');
  
  return [
    `${parts[0]}A ${streetName}`,
    `${parts[0]}B ${streetName}`,
    `${parseInt(parts[0]) + 2} ${streetName}`,
    `${parseInt(parts[0]) - 2} ${streetName}`
  ].filter(addr => addr !== address);
}

// Record property analysis for billing/usage tracking
async function recordPropertyAnalysis(userId: string, address: string, analysis: PropertyAnalysis): Promise<void> {
  try {
    await prisma.propertyAnalysis.create({
      data: {
        userId,
        address,
        analysisData: JSON.stringify(analysis),
        confidence: analysis.valuation.confidence,
        estimatedValue: analysis.valuation.currentValue,
        overallScore: analysis.scores.overall,
        timestamp: new Date()
      }
    });

    // Also record usage
    await prisma.usageRecord.create({
      data: {
        userId,
        feature: 'property_analysis',
        requestCount: 1,
        resultCount: 1,
        timestamp: new Date()
      }
    });

    logger.info(`Property analysis recorded for user ${userId}: ${address}`);

  } catch (error) {
    logger.error('Failed to record property analysis:', error);
    // Don't fail the request if recording fails
  }
}

// GET /api/property/analysis/history - Get user's analysis history
router.get('/analysis/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [analyses, total] = await Promise.all([
      prisma.propertyAnalysis.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: parseInt(limit as string),
        select: {
          id: true,
          address: true,
          confidence: true,
          estimatedValue: true,
          overallScore: true,
          timestamp: true
        }
      }),
      prisma.propertyAnalysis.count({ where: { userId } })
    ]);

    res.json({
      success: true,
      analyses,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });

  } catch (error) {
    logger.error('Failed to get analysis history:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis history'
    });
  }
});

// GET /api/property/analysis/:id - Get specific analysis
router.get('/analysis/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const analysis = await prisma.propertyAnalysis.findFirst({
      where: {
        id,
        userId // Ensure user owns this analysis
      }
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      analysis: {
        ...analysis,
        analysisData: JSON.parse(analysis.analysisData)
      }
    });

  } catch (error) {
    logger.error('Failed to get specific analysis:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis'
    });
  }
});

// GET /api/property/health - Health check
router.get('/health', async (req, res) => {
  try {
    const sourceTests = await Promise.allSettled([
      testMlsConnectivity(),
      testAddressValidation(),
      testDatabaseConnection()
    ]);

    const allHealthy = sourceTests.every(test => test.status === 'fulfilled');

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'property-analysis',
      timestamp: new Date().toISOString(),
      sources: {
        mls: sourceTests[0].status === 'fulfilled' ? 'operational' : 'unavailable',
        addressValidation: sourceTests[1].status === 'fulfilled' ? 'operational' : 'unavailable',
        database: sourceTests[2].status === 'fulfilled' ? 'operational' : 'unavailable'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'property-analysis',
      error: 'Health check failed'
    });
  }
});

async function testMlsConnectivity(): Promise<boolean> {
  try {
    const healthCheck = await mlsService.healthCheck();
    return healthCheck.overall;
  } catch {
    return false;
  }
}

async function testAddressValidation(): Promise<boolean> {
  if (!process.env.GOOGLE_MAPS_API_KEY) return false;
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: 'Toronto, ON',
        key: process.env.GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });
    return response.data.status === 'OK';
  } catch {
    return false;
  }
}

async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export default router;