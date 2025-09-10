import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();

    // Simple auth check
    if (secret !== process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found" },
        { status: 404 },
      );
    }

    // Reset admin password to simple string
    const newPassword = "admin123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin password reset successfully",
      email: adminUser.email,
      newPassword: newPassword,
    });
  } catch (error) {
    console.error("Admin reset error:", error);
    return NextResponse.json(
      {
        error: "Admin reset failed",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
