// Create admin user script
const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'mike.holownych@agentradar.app' }
    });

    if (existingUser) {
      // Update existing user to admin role
      const updatedUser = await prisma.user.update({
        where: { email: 'mike.holownych@agentradar.app' },
        data: {
          role: 'ADMIN',
          subscriptionTier: 'WHITE_LABEL'
        }
      });
      console.log('✅ Updated existing user to admin:', updatedUser.email);
      return updatedUser;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123!', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'mike.holownych@agentradar.app',
        firstName: 'Mike',
        lastName: 'Holownych', 
        password: hashedPassword,
        role: 'ADMIN',
        subscriptionTier: 'WHITE_LABEL',
        isActive: true,
        company: 'AgentRadar',
        location: 'Toronto, ON'
      }
    });

    console.log('✅ Created admin user:', adminUser.email);
    console.log('📧 Email: mike.holownych@agentradar.app');
    console.log('🔑 Password: admin123!');
    
    return adminUser;

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => {
    console.log('✅ Admin user setup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  });