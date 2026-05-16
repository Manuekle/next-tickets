import { PrismaClient, Role, TicketStatus, TicketPriority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // ── Users ──
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexttickets.com' },
    update: {},
    create: { email: 'admin@nexttickets.com', passwordHash, name: 'Super Admin', role: Role.SUPER_ADMIN, emailVerified: true },
  });
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
  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@nexttickets.com' },
    update: {},
    create: { email: 'agent2@nexttickets.com', passwordHash, name: 'Bob Agent', role: Role.AGENT, emailVerified: true },
  });
  const customer = await prisma.user.upsert({
    where: { email: 'customer@nexttickets.com' },
    update: {},
    create: { email: 'customer@nexttickets.com', passwordHash, name: 'Charlie Customer', role: Role.CUSTOMER, emailVerified: true },
  });
  console.log('  ✅ 5 users (admin, admin2, agent1, agent2, customer)');

  // ── Categories ──
  const catData = [
    { name: 'Bug Report', slug: 'bug-report', color: '#ef4444' },
    { name: 'Feature Request', slug: 'feature-request', color: '#3b82f6' },
    { name: 'Account Issue', slug: 'account-issue', color: '#f59e0b' },
    { name: 'Billing', slug: 'billing', color: '#10b981' },
    { name: 'General Inquiry', slug: 'general-inquiry', color: '#8b5cf6' },
  ];
  for (const cat of catData) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  const categories = await prisma.category.findMany();
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c]));
  console.log('  ✅ 5 categories');

  // ── Tags ──
  const tagNames = ['urgent', 'pending-info', 'duplicated', 'wont-fix', 'needs-review', 'high-priority', 'low-priority', 'enhancement', 'question', 'documentation'];
  for (const name of tagNames) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }
  const tags = await prisma.tag.findMany();
  const tagMap = Object.fromEntries(tags.map((t) => [t.name, t]));
  console.log('  ✅ 10 tags');

  // ── Tickets ──
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  const ticketsData = [
    { title: 'Unable to login after password reset', desc: 'I reset my password but now I cannot login. Getting "Invalid credentials". Please help.', priority: TicketPriority.HIGH, status: TicketStatus.OPEN, customer, agent: agent1, cat: 'bug-report', tag: 'urgent', created: daysAgo(2) },
    { title: 'Add dark mode support', desc: 'Would be great to have a dark mode option in the settings panel for late-night use.', priority: TicketPriority.LOW, status: TicketStatus.OPEN, customer, agent: null, cat: 'feature-request', tag: 'enhancement', created: daysAgo(3) },
    { title: 'Invoice #1234 has wrong amount', desc: 'My latest invoice shows $299 but my plan is $99/month. Please correct this.', priority: TicketPriority.CRITICAL, status: TicketStatus.IN_PROGRESS, customer, agent: agent1, cat: 'billing', tag: 'urgent', created: daysAgo(1) },
    { title: 'Can\'t reset 2FA device', desc: 'I got a new phone and need to transfer my authenticator app. The current option is not working.', priority: TicketPriority.MEDIUM, status: TicketStatus.WAITING_ON_CUSTOMER, customer, agent: agent2, cat: 'account-issue', tag: 'pending-info', created: daysAgo(4) },
    { title: 'Feature request: CSV export for reports', desc: 'Need ability to export analytics reports to CSV for our monthly meetings.', priority: TicketPriority.MEDIUM, status: TicketStatus.RESOLVED, customer, agent: agent1, cat: 'feature-request', tag: null, created: daysAgo(7), resolved: daysAgo(5) },
    { title: 'Page loads slowly on mobile', desc: 'The dashboard takes over 10 seconds to load on my phone (Samsung Galaxy).', priority: TicketPriority.HIGH, status: TicketStatus.IN_PROGRESS, customer, agent: agent2, cat: 'bug-report', tag: 'high-priority', created: daysAgo(2) },
    { title: 'Need API documentation for webhooks', desc: 'We want to integrate with your platform but need webhook documentation first.', priority: TicketPriority.LOW, status: TicketStatus.CLOSED, customer, agent: null, cat: 'general-inquiry', tag: 'question', created: daysAgo(10), resolved: daysAgo(8) },
    { title: 'Multiple sessions logged out randomly', desc: 'Users are being logged out multiple times a day. This started after the latest update.', priority: TicketPriority.CRITICAL, status: TicketStatus.OPEN, customer, agent: null, cat: 'bug-report', tag: 'urgent', created: daysAgo(0) },
  ];

  for (const t of ticketsData) {
    const ticket = await prisma.ticket.create({
      data: {
        title: t.title,
        description: t.desc,
        priority: t.priority,
        status: t.status,
        customerId: t.customer.id,
        assignedToId: t.agent?.id || null,
        categoryId: catMap[t.cat]?.id || null,
        createdAt: t.created || now,
        resolvedAt: (t as any).resolved || null,
      },
    });

    await prisma.activityLog.create({
      data: { action: 'ticket.created', details: { title: t.title }, ticketId: ticket.id, userId: t.customer.id, createdAt: t.created || now },
    });

    if (t.agent) {
      await prisma.activityLog.create({
        data: { action: 'ticket.assigned', details: { agent: t.agent.name }, ticketId: ticket.id, userId: admin.id, createdAt: new Date((t.created?.getTime() || now.getTime()) + 60000) },
      });
    }

    if (t.tag && tagMap[t.tag]) {
      await prisma.ticketTag.create({ data: { ticketId: ticket.id, tagId: tagMap[t.tag].id } });
    }
  }
  const allTickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`  ✅ ${allTickets.length} tickets with activity logs`);

  // ── Comments ──
  const ticket1 = allTickets[0];
  await prisma.ticketComment.create({
    data: { content: 'I tried clearing my cache and cookies but still getting the same error.', isInternal: false, ticketId: ticket1.id, authorId: customer.id, createdAt: daysAgo(1) },
  });
  await prisma.ticketComment.create({
    data: { content: 'Looking into this now. Can you confirm which browser you are using?', isInternal: false, ticketId: ticket1.id, authorId: agent1.id, createdAt: daysAgo(0) },
  });
  await prisma.ticketComment.create({
    data: { content: 'This might be related to the JWT token rotation issue we saw last week. Check the auth service logs.', isInternal: true, ticketId: ticket1.id, authorId: agent1.id, createdAt: daysAgo(0) },
  });
  await prisma.activityLog.create({
    data: { action: 'comment.added', details: { count: 3 }, ticketId: ticket1.id, userId: customer.id, createdAt: daysAgo(0) },
  });

  const ticket3 = allTickets[2]; // billing ticket
  await prisma.ticketComment.create({
    data: { content: 'I have attached the invoice screenshot for reference.', isInternal: false, ticketId: ticket3.id, authorId: customer.id, createdAt: daysAgo(0) },
  });
  console.log('  ✅ Comments added to tickets');

  // ── Knowledge Base ──
  const articles = [
    { title: 'How to reset your password', excerpt: 'Step-by-step guide to reset your account password.', content: `# How to Reset Your Password\n\n1. Go to the login page\n2. Click "Forgot password"\n3. Enter your email address\n4. Check your inbox for a reset link\n5. Click the link and enter your new password\n\n> If you don't receive the email within 5 minutes, check your spam folder.`, slug: 'reset-password', cat: 'account-issue' },
    { title: 'Understanding ticket priorities', excerpt: 'Learn how priorities work and when to use each level.', content: `# Ticket Priorities\n\n## Low\nNon-urgent issues or feature requests. Response within 48 hours.\n\n## Medium\nStandard issues affecting functionality. Response within 24 hours.\n\n## High\nCritical issues affecting key features. Response within 4 hours.\n\n## Critical\nSystem down or security issues. Response within 1 hour.`, slug: 'ticket-priorities', cat: 'general-inquiry' },
    { title: 'How to export your data', excerpt: 'Export tickets, reports, and analytics as CSV or PDF.', content: `# Exporting Data\n\nNavigate to the Analytics section and click "Export CSV" to download your data.\n\nAvailable exports:\n- Ticket list with all fields\n- Agent performance reports\n- SLA compliance data\n- Custom date range filters`, slug: 'export-data', cat: 'feature-request' },
  ];

  for (const a of articles) {
    await prisma.knowledgeArticle.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        title: a.title, content: a.content, excerpt: a.excerpt, slug: a.slug,
        published: true, helpfulCount: Math.floor(Math.random() * 15), notHelpfulCount: Math.floor(Math.random() * 3),
        categoryId: catMap[a.cat]?.id || null, authorId: admin.id,
      },
    });
  }
  console.log('  ✅ 3 knowledge base articles');

  // ── SLA Rules ──
  await prisma.sLA.createMany({
    data: [
      { name: 'Critical SLA', description: 'Response within 1 hour, resolution within 4 hours', firstResponseHours: 1, resolutionHours: 4, priority: TicketPriority.CRITICAL },
      { name: 'High SLA', description: 'Response within 4 hours, resolution within 24 hours', firstResponseHours: 4, resolutionHours: 24, priority: TicketPriority.HIGH },
      { name: 'Medium SLA', description: 'Response within 24 hours, resolution within 72 hours', firstResponseHours: 24, resolutionHours: 72, priority: TicketPriority.MEDIUM },
      { name: 'Low SLA', description: 'Response within 48 hours, resolution within 1 week', firstResponseHours: 48, resolutionHours: 168, priority: TicketPriority.LOW },
    ],
    skipDuplicates: true,
  });
  console.log('  ✅ 4 SLA rules');

  // ── Automation Rule ──
  await prisma.automation.upsert({
    where: { id: 'default-auto' },
    update: {},
    create: {
      id: 'default-auto',
      name: 'Auto-assign critical tickets',
      description: 'Automatically assigns critical priority tickets to the first available agent',
      trigger: 'ticket.created',
      conditions: [{ field: 'priority', operator: 'equals', value: 'CRITICAL' }],
      actions: [{ type: 'assign_team', params: {} }],
      isActive: true,
    },
  });
  console.log('  ✅ 1 automation rule');

  console.log('\n✨ Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:    admin@nexttickets.com / Admin123!');
  console.log('  Agent:    agent1@nexttickets.com / Admin123!');
  console.log('  Customer: customer@nexttickets.com / Admin123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
