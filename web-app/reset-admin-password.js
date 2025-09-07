const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const updated = await prisma.user.update({
      where: { email: 'mike.holownych@agentradar.app' },
      data: { password: hashedPassword }
    });
    
    console.log('Admin password reset successfully');
    console.log('Email: mike.holownych@agentradar.app');
    console.log('New Password: admin123');
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();