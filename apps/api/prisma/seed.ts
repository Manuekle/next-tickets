import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexttickets.com' },
    update: {},
    create: { email: 'admin@nexttickets.com', passwordHash, name: 'Super Admin', role: Role.SUPER_ADMIN, emailVerified: true },
  });
  console.log('Created super admin:', admin.email);

  await prisma.user.upsert({
    where: { email: 'admin2@nexttickets.com' },
    update: {},
    create: { email: 'admin2@nexttickets.com', passwordHash, name: 'Admin User', role: Role.ADMIN, emailVerified: true },
  });

  const agent1 = await prisma.user.upsert({
    where: { email: 'agent1@nexttickets.com' },
    update: {},
    create: { email: 'agent1@nexttickets.com', passwordHash, name: 'Alice Agent', role: Role.AGENT, emailVerified: true },
  });

  await prisma.user.upsert({
    where: { email: 'agent2@nexttickets.com' },
    update: {},
    create: { email: 'agent2@nexttickets.com', passwordHash, name: 'Bob Agent', role: Role.AGENT, emailVerified: true },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@nexttickets.com' },
    update: {},
    create: { email: 'customer@nexttickets.com', passwordHash, name: 'Charlie Customer', role: Role.CUSTOMER, emailVerified: true },
  });
  console.log('Created customer:', customer.email);

  // Categories
  const categories = [
    { name: 'Bug Report', slug: 'bug-report', color: '#ef4444' },
    { name: 'Feature Request', slug: 'feature-request', color: '#3b82f6' },
    { name: 'Account Issue', slug: 'account-issue', color: '#f59e0b' },
    { name: 'Billing', slug: 'billing', color: '#10b981' },
    { name: 'General Inquiry', slug: 'general-inquiry', color: '#8b5cf6' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('Created categories');

  // Tags
  const tags = ['urgent', 'pending-info', 'duplicated', 'wont-fix', 'needs-review', 'high-priority', 'low-priority', 'enhancement', 'question', 'documentation'];
  for (const name of tags) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Created tags');

  // Demo tickets
  const bugCategory = await prisma.category.findUnique({ where: { slug: 'bug-report' } });
  const featureCategory = await prisma.category.findUnique({ where: { slug: 'feature-request' } });
  const urgentTag = await prisma.tag.findUnique({ where: { name: 'urgent' } });

  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Unable to login after password reset',
      description: 'I reset my password but now I cannot login with the new password. Getting an "Invalid credentials" error.',
      priority: 'HIGH',
      status: 'OPEN',
      customerId: customer.id,
      assignedToId: agent1.id,
      categoryId: bugCategory?.id,
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Add dark mode support',
      description: 'Would be great to have a dark mode option in the settings panel.',
      priority: 'LOW',
      status: 'OPEN',
      customerId: customer.id,
      categoryId: featureCategory?.id,
    },
  });

  // Activity log for ticket 1
  await prisma.activityLog.create({
    data: {
      action: 'ticket.created',
      details: { title: ticket1.title },
      ticketId: ticket1.id,
      userId: customer.id,
    },
  });

  console.log('Seed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('  Admin: admin@nexttickets.com / Admin123!');
  console.log('  Agent: agent1@nexttickets.com / Admin123!');
  console.log('  Customer: customer@nexttickets.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
