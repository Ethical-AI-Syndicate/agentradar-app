/**
 * Quick script to create an admin user for testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123!', 10);
    
    const _admin = await prisma.user.create({
      data: {
        email: 'admin@agentradar.app',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        subscriptionTier: 'WHITE_LABEL'
      }
    });
    
    console.log('Admin user created successfully:');
    console.log('Email: admin@agentradar.app');
    console.log('Password: admin123!');
    console.log('Role: ADMIN');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Admin user already exists with email: admin@agentradar.app');
    } else {
      console.error('Error creating admin user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();