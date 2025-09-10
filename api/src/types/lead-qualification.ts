/**
 * Types for Lead Qualification Service
 * These models will eventually be added to the Prisma schema
 */

export interface LeadScore {
  id: string;
  leadId: string;
  bantScore: number;
  engagementScore: number;
  totalScore: number;
  tier: "HOT" | "WARM" | "COLD";
  priority: "HIGH" | "MEDIUM" | "LOW";
  lastUpdated: Date;
  scoringFactors?: string;
}

export interface LeadQualificationProfile {
  id: string;
  contactName: string;
  email: string;
  companyName: string;
  phone?: string;
  companySize: number;
  estimatedBudget: number;
  timeline: string;
  authority: string;
  needLevel: string;
  engagementScore: number;
  leadSource: string;
  qualificationNotes?: string;
  salesRepAssigned: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesActivity {
  id: string;
  leadId: string;
  activityType: string;
  description: string;
  scheduledFor?: Date;
  completedDate?: Date;
  assignedTo?: string;
  status: string;
  outcome?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
