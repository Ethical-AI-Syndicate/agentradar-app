import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check if any admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: "Admin user already exists",
        email: existingAdmin.email,
      });
    }

    // Create admin user with default credentials
    const adminEmail = "admin@agentradar.app";
    const adminPassword = "admin123!";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        subscriptionTier: "TEAM_ENTERPRISE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      email: adminUser.email,
      tempPassword: adminPassword,
      note: "Please change the password after first login",
    });
  } catch (error) {
    console.error("Admin initialization error:", error);
    return NextResponse.json(
      {
        error: "Admin initialization failed",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
