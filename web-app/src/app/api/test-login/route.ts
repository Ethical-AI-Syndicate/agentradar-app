import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("Testing login for:", email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({
        error: "User not found",
        searchedEmail: email.toLowerCase(),
      });
    }

    console.log("User found:", {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    console.log("Password check result:", isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json({
        error: "Invalid password",
        passwordMatch: false,
      });
    }

    // Check JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({
        error: "JWT_SECRET not configured",
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      jwtSecretExists: !!jwtSecret,
    });
  } catch (error) {
    console.error("Test login error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
