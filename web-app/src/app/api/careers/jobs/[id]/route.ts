import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const job = await prisma.jobPosting.findUnique({
      where: { id }
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Format salary range
    const salaryRange = job.salaryRangeMin && job.salaryRangeMax 
      ? `$${(job.salaryRangeMin / 100).toLocaleString()} - $${(job.salaryRangeMax / 100).toLocaleString()} ${job.salaryCurrency}`
      : 'Competitive';

    const formattedJob = {
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType,
      salaryRange,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits || 'Competitive benefits package',
      remoteWork: job.remoteWork,
      experienceLevel: job.experienceLevel,
      applicationsCount: job.applicationsCount,
      daysPosted: Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    };

    return NextResponse.json({ job: formattedJob });
  } catch (error) {
    console.error("Error fetching job details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}