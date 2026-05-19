import { PrismaClient, Role, TicketStatus, TicketPriority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function wipe() {
  console.log('  🗑️  Wiping existing data…');
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.ticketTag.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.ticketComment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.knowledgeArticle.deleteMany({});
  await prisma.automation.deleteMany({});
  await prisma.sLA.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('  ✅ Data wiped');
}

async function main() {
  console.log('\n🌱 Seeding database…\n');
  await wipe();

  const hash = await bcrypt.hash('Admin123!', 12);
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

  /* ─── Users ─── */
  const superAdmin = await prisma.user.create({ data: { email: 'admin@nexttickets.com',   passwordHash: hash, name: 'Alex Rivera',     role: Role.SUPER_ADMIN, emailVerified: true } });
  const admin      = await prisma.user.create({ data: { email: 'admin2@nexttickets.com',  passwordHash: hash, name: 'Jordan Chen',     role: Role.ADMIN,       emailVerified: true } });
  const agent1     = await prisma.user.create({ data: { email: 'sara@nexttickets.com',    passwordHash: hash, name: 'Sara Kim',        role: Role.AGENT,       emailVerified: true } });
  const agent2     = await prisma.user.create({ data: { email: 'marcus@nexttickets.com',  passwordHash: hash, name: 'Marcus Webb',     role: Role.AGENT,       emailVerified: true } });
  const agent3     = await prisma.user.create({ data: { email: 'elena@nexttickets.com',   passwordHash: hash, name: 'Elena Vasquez',   role: Role.AGENT,       emailVerified: true } });
  const cust1      = await prisma.user.create({ data: { email: 'tyler@acme.com',          passwordHash: hash, name: 'Tyler Morgan',    role: Role.CUSTOMER,    emailVerified: true } });
  const cust2      = await prisma.user.create({ data: { email: 'priya@globex.io',         passwordHash: hash, name: 'Priya Sharma',    role: Role.CUSTOMER,    emailVerified: true } });
  const cust3      = await prisma.user.create({ data: { email: 'james@initech.com',       passwordHash: hash, name: 'James Okafor',    role: Role.CUSTOMER,    emailVerified: true } });
  const cust4      = await prisma.user.create({ data: { email: 'mia@startupxyz.com',      passwordHash: hash, name: 'Mia Johansson',   role: Role.CUSTOMER,    emailVerified: true } });
  const cust5      = await prisma.user.create({ data: { email: 'dev@techcorp.com',        passwordHash: hash, name: 'Dev Patel',       role: Role.CUSTOMER,    emailVerified: true } });
  console.log('  ✅ 10 users created');

  /* ─── Categories ─── */
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Bug Report',       slug: 'bug-report',       color: '#ef4444', description: 'Software defects and unexpected behavior' } }),
    prisma.category.create({ data: { name: 'Feature Request',  slug: 'feature-request',  color: '#3b82f6', description: 'New functionality requests' } }),
    prisma.category.create({ data: { name: 'Account & Access', slug: 'account-access',   color: '#f59e0b', description: 'Login, permissions, and account management' } }),
    prisma.category.create({ data: { name: 'Billing',          slug: 'billing',          color: '#10b981', description: 'Invoices, payments, and subscription issues' } }),
    prisma.category.create({ data: { name: 'Performance',      slug: 'performance',      color: '#8b5cf6', description: 'Slow load times and responsiveness issues' } }),
    prisma.category.create({ data: { name: 'Integration',      slug: 'integration',      color: '#06b6d4', description: 'API, webhooks, and third-party integrations' } }),
    prisma.category.create({ data: { name: 'Security',         slug: 'security',         color: '#f97316', description: 'Vulnerabilities and security incidents' } }),
    prisma.category.create({ data: { name: 'General Inquiry',  slug: 'general-inquiry',  color: '#6b7280', description: 'General questions and support' } }),
  ]);
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c]));
  console.log('  ✅ 8 categories created');

  /* ─── Tags ─── */
  const tagNames = ['urgent', 'needs-review', 'wont-fix', 'duplicate', 'regression', 'security', 'data-loss', 'ux-issue', 'documentation', 'api', 'mobile', 'desktop', 'enterprise', 'sla-risk', 'customer-reported'];
  const tags = await Promise.all(tagNames.map((name) => prisma.tag.create({ data: { name } })));
  const tagMap = Object.fromEntries(tags.map((t) => [t.name, t]));
  console.log('  ✅ 15 tags created');

  /* ─── SLA rules ─── */
  await prisma.sLA.createMany({
    data: [
      { name: 'Critical Response SLA', description: '1h response, 4h resolution for critical issues', firstResponseHours: 1,  resolutionHours: 4,   priority: TicketPriority.CRITICAL, isActive: true },
      { name: 'High Priority SLA',     description: '4h response, 24h resolution for high priority',  firstResponseHours: 4,  resolutionHours: 24,  priority: TicketPriority.HIGH,     isActive: true },
      { name: 'Standard SLA',          description: '24h response, 72h resolution for medium tickets', firstResponseHours: 24, resolutionHours: 72,  priority: TicketPriority.MEDIUM,   isActive: true },
      { name: 'Low Priority SLA',      description: '48h response, 7-day resolution for low priority', firstResponseHours: 48, resolutionHours: 168, priority: TicketPriority.LOW,      isActive: true },
    ],
  });
  console.log('  ✅ 4 SLA rules created');

  /* ─── Automation rules ─── */
  await prisma.automation.createMany({
    data: [
      {
        name: 'Auto-escalate critical tickets',
        description: 'Assigns critical tickets to senior agents and notifies admin',
        trigger: 'ticket.created',
        conditions: JSON.stringify([{ field: 'priority', operator: 'equals', value: 'CRITICAL' }]),
        actions: JSON.stringify([{ type: 'assign_team', params: {} }, { type: 'send_notification', params: { userId: superAdmin.id, title: 'Critical ticket created', body: 'A new critical ticket needs immediate attention' } }]),
        isActive: true,
      },
      {
        name: 'Auto-close resolved tickets after 7 days',
        description: 'Automatically closes tickets that have been in Resolved status for 7+ days',
        trigger: 'ticket.updated',
        conditions: JSON.stringify([{ field: 'status', operator: 'equals', value: 'RESOLVED' }]),
        actions: JSON.stringify([{ type: 'set_status', params: { status: 'CLOSED' } }]),
        isActive: true,
      },
      {
        name: 'Tag security issues',
        description: 'Adds security tag to tickets in the Security category',
        trigger: 'ticket.created',
        conditions: JSON.stringify([{ field: 'category', operator: 'equals', value: 'security' }]),
        actions: JSON.stringify([{ type: 'add_tags', params: { tagName: 'security' } }, { type: 'set_priority', params: { priority: 'HIGH' } }]),
        isActive: true,
      },
      {
        name: 'SLA breach notification',
        description: 'Notifies team lead when an SLA is breached',
        trigger: 'sla.breached',
        conditions: JSON.stringify([]),
        actions: JSON.stringify([{ type: 'send_notification', params: { userId: admin.id, title: 'SLA Breached', body: 'A ticket has breached its SLA commitment' } }, { type: 'add_tags', params: { tagName: 'sla-risk' } }]),
        isActive: true,
      },
      {
        name: 'Route billing tickets',
        description: 'Assigns billing tickets to the finance-trained agent',
        trigger: 'ticket.created',
        conditions: JSON.stringify([{ field: 'category', operator: 'equals', value: 'billing' }]),
        actions: JSON.stringify([{ type: 'assign_user', params: { userId: agent2.id } }]),
        isActive: false,
      },
    ],
  });
  console.log('  ✅ 5 automation rules created');

  /* ─── Tickets ─── */

  type UserRef = { id: string };
  type TicketSeed = {
    title: string;
    desc: string;
    priority: TicketPriority;
    status: TicketStatus;
    customer: UserRef;
    agent: UserRef | null;
    cat: string;
    tags: string[];
    created: Date;
    resolved?: Date;
    slaBreached?: boolean;
  };

  const ticketSeeds: TicketSeed[] = [
    // Critical / High
    { title: 'Production database connection pool exhausted',        desc: 'Our production DB is throwing "connection pool exhausted" errors since 14:30 UTC. API response times are >30s and many requests are failing. This is affecting all enterprise customers.',                                   priority: TicketPriority.CRITICAL, status: TicketStatus.IN_PROGRESS,         customer: cust1,  agent: agent1,  cat: 'bug-report',      tags: ['urgent', 'enterprise', 'sla-risk'],    created: daysAgo(0)   },
    { title: 'Security vulnerability in OAuth token handling',        desc: 'We detected that refresh tokens are not being properly invalidated on logout. An attacker with a captured token can continue to access the API. We need an emergency patch.',                                                  priority: TicketPriority.CRITICAL, status: TicketStatus.OPEN,                customer: cust2,  agent: null,    cat: 'security',        tags: ['security', 'urgent', 'data-loss'],     created: daysAgo(0)   },
    { title: 'Invoice #5821 charged twice for same period',           desc: 'Our accounting team noticed we were charged $1,299 twice on March 15. Invoice IDs: INV-5821 and INV-5822. Our contract is a single $1,299/month. Please process a refund immediately.',                                     priority: TicketPriority.CRITICAL, status: TicketStatus.IN_PROGRESS,         customer: cust3,  agent: agent2,  cat: 'billing',         tags: ['urgent', 'enterprise'],                created: daysAgo(1)   },
    { title: 'API rate limiting rejecting valid enterprise requests',  desc: 'Since the v2.4 deployment our enterprise integration is hitting rate limits despite being on an unlimited tier. We are seeing 429 errors on batch import endpoints. Batch job is completely blocked.',                      priority: TicketPriority.HIGH,     status: TicketStatus.IN_PROGRESS,         customer: cust4,  agent: agent1,  cat: 'integration',     tags: ['api', 'enterprise', 'regression'],     created: daysAgo(1)   },
    { title: 'Mobile app crashes on launch (iOS 17.4)',               desc: 'After updating to iOS 17.4, our entire team cannot launch the mobile app. It crashes immediately on startup. We are running version 3.2.1 of the app. Affects 40+ users at our company.',                                    priority: TicketPriority.HIGH,     status: TicketStatus.OPEN,                customer: cust5,  agent: null,    cat: 'bug-report',      tags: ['mobile', 'urgent', 'regression'],      created: daysAgo(1)   },
    { title: 'Data export includes deleted records',                  desc: 'When we export ticket data to CSV, the file includes tickets that were deleted 6 months ago. This is causing compliance issues as we should not have this data in our exports.',                                              priority: TicketPriority.HIGH,     status: TicketStatus.OPEN,                customer: cust1,  agent: agent3,  cat: 'bug-report',      tags: ['data-loss', 'enterprise', 'security'], created: daysAgo(2)   },
    { title: 'SSO integration broken after domain migration',         desc: 'We migrated our domain to acme-corp.io but the SAML SSO configuration is still pointing to the old domain. Our entire team is locked out. The IT admin account still works via email/password.',                            priority: TicketPriority.HIGH,     status: TicketStatus.WAITING_ON_CUSTOMER, customer: cust2,  agent: agent1,  cat: 'account-access',  tags: ['urgent', 'enterprise'],                created: daysAgo(2)   },
    // Medium
    { title: 'Dashboard reports showing incorrect date ranges',       desc: 'The "Last 30 days" filter in Analytics dashboard is including data from 45 days ago. We noticed this when comparing the dashboard to our internal BI tool.',                                                                  priority: TicketPriority.MEDIUM,   status: TicketStatus.IN_PROGRESS,         customer: cust3,  agent: agent2,  cat: 'bug-report',      tags: ['needs-review', 'ux-issue'],            created: daysAgo(3)   },
    { title: 'Bulk ticket assignment not persisting',                 desc: 'When we select multiple tickets and bulk-assign them to an agent, the change shows in the UI but reverts after page refresh. This is intermittent — happens about 60% of the time.',                                         priority: TicketPriority.MEDIUM,   status: TicketStatus.IN_PROGRESS,         customer: cust4,  agent: agent3,  cat: 'bug-report',      tags: ['regression', 'ux-issue'],              created: daysAgo(3)   },
    { title: 'Email notifications sent in wrong language',            desc: 'Our team has accounts configured with French locale but all notification emails are arriving in English. The in-app UI shows French correctly — only email is affected.',                                                     priority: TicketPriority.MEDIUM,   status: TicketStatus.OPEN,                customer: cust5,  agent: null,    cat: 'bug-report',      tags: ['customer-reported'],                   created: daysAgo(4)   },
    { title: 'Webhook events not firing for status changes',          desc: 'We set up webhooks for the ticket.status_changed event but our endpoint is not receiving any events. We verified the endpoint is live — it receives test pings fine. The issue is only with real events.',                   priority: TicketPriority.MEDIUM,   status: TicketStatus.OPEN,                customer: cust1,  agent: null,    cat: 'integration',     tags: ['api', 'needs-review'],                 created: daysAgo(4)   },
    { title: 'Add bulk import for knowledge base articles',           desc: 'We have 200+ legacy help articles that need to be migrated. Can you add CSV/JSON import functionality for the knowledge base? Currently we can only create articles one by one which is very time-consuming.',               priority: TicketPriority.MEDIUM,   status: TicketStatus.OPEN,                customer: cust2,  agent: null,    cat: 'feature-request', tags: ['documentation'],                       created: daysAgo(5)   },
    { title: 'Custom field support for ticket forms',                 desc: 'We need to capture product version and environment (production/staging/dev) on every ticket. Can you add custom fields that we can configure and make required? This is critical for our support workflow.',                priority: TicketPriority.MEDIUM,   status: TicketStatus.OPEN,                customer: cust3,  agent: null,    cat: 'feature-request', tags: ['enterprise'],                          created: daysAgo(5)   },
    { title: 'Can\'t reset MFA — new device after phone replacement',desc: 'I replaced my phone and now cannot access my authenticator app codes. The "reset MFA" option in account settings throws an error: "Verification failed." I am completely locked out.',                                      priority: TicketPriority.MEDIUM,   status: TicketStatus.WAITING_ON_CUSTOMER, customer: cust4,  agent: agent2,  cat: 'account-access',  tags: ['customer-reported'],                   created: daysAgo(6)   },
    { title: 'Slow performance on ticket list with 1000+ tickets',   desc: 'Our workspace now has over 1,200 tickets and the tickets list page takes 12-15 seconds to load. Filtering and sorting also feels sluggish. This was not an issue when we had <500 tickets.',                               priority: TicketPriority.MEDIUM,   status: TicketStatus.IN_PROGRESS,         customer: cust5,  agent: agent3,  cat: 'performance',     tags: ['enterprise', 'ux-issue'],              created: daysAgo(7)   },
    // Low / resolved / closed
    { title: 'Dark mode colors inconsistent in comment editor',       desc: 'In dark mode, the comment text editor has a white background while the rest of the interface is dark. It makes it look unfinished.',                                                                                           priority: TicketPriority.LOW,      status: TicketStatus.RESOLVED,            customer: cust1,  agent: agent1,  cat: 'bug-report',      tags: ['ux-issue', 'needs-review'],            created: daysAgo(8),  resolved: daysAgo(5) },
    { title: 'Add keyboard shortcut to create new ticket',            desc: 'Would love a keyboard shortcut (like Ctrl+N or Cmd+N) to quickly create a new ticket without reaching for the mouse. Similar to how Linear and Jira handle this.',                                                           priority: TicketPriority.LOW,      status: TicketStatus.RESOLVED,            customer: cust2,  agent: agent2,  cat: 'feature-request', tags: ['ux-issue'],                            created: daysAgo(10), resolved: daysAgo(7) },
    { title: 'Typo in password reset email template',                 desc: 'The password reset email says "Click the link bellow to reset" — should be "below". Small thing but looks unprofessional for enterprise customers.',                                                                          priority: TicketPriority.LOW,      status: TicketStatus.CLOSED,              customer: cust3,  agent: agent3,  cat: 'bug-report',      tags: ['documentation'],                       created: daysAgo(14), resolved: daysAgo(12) },
    { title: 'Pagination breaks when filtering by multiple tags',     desc: 'When filtering the ticket list by 2+ tags, the pagination shows "Page 1 of 0" and the Previous/Next buttons do not work correctly.',                                                                                         priority: TicketPriority.LOW,      status: TicketStatus.RESOLVED,            customer: cust4,  agent: agent1,  cat: 'bug-report',      tags: ['ux-issue', 'regression'],              created: daysAgo(15), resolved: daysAgo(11) },
    { title: 'Request for HIPAA compliance documentation',            desc: 'Our legal team needs your current HIPAA BAA and compliance documentation for our annual audit. Can you send this to compliance@initech.com or upload it to our shared folder?',                                               priority: TicketPriority.LOW,      status: TicketStatus.CLOSED,              customer: cust3,  agent: agent2,  cat: 'general-inquiry', tags: ['enterprise', 'documentation'],         created: daysAgo(20), resolved: daysAgo(18) },
    { title: 'API documentation for SLA endpoints missing',           desc: 'The API docs at /docs reference SLA endpoints but the actual route definitions are missing. Specifically /api/sla/check-breaches and /api/sla/metrics are not documented.',                                                  priority: TicketPriority.LOW,      status: TicketStatus.OPEN,                customer: cust5,  agent: null,    cat: 'integration',     tags: ['api', 'documentation'],                created: daysAgo(9)   },
    // Additional tickets (21-40)
    { title: 'Two-factor authentication codes not being delivered',   desc: 'Our users are not receiving 2FA SMS codes when logging in. This has been an issue for 3 hours. Users are completely locked out unless they use backup codes. Affects ~120 active users.',                                        priority: TicketPriority.CRITICAL, status: TicketStatus.IN_PROGRESS,         customer: cust1,  agent: agent3,  cat: 'account-access',  tags: ['urgent', 'customer-reported'],         created: daysAgo(0)   },
    { title: 'GDPR data deletion request not completing',             desc: 'A customer submitted a GDPR right-to-erasure request 35 days ago (required to complete in 30 days). The automated deletion job failed silently. We are now out of compliance.',                                                   priority: TicketPriority.CRITICAL, status: TicketStatus.OPEN,                customer: cust2,  agent: null,    cat: 'security',        tags: ['data-loss', 'security', 'urgent'],     created: daysAgo(1)   },
    { title: 'File attachments not uploading — 413 errors',           desc: 'Agents cannot attach files to tickets. Attempting to upload any file (even small 50KB images) results in "413 Request Entity Too Large." This worked fine yesterday.',                                                           priority: TicketPriority.HIGH,     status: TicketStatus.IN_PROGRESS,         customer: cust3,  agent: agent1,  cat: 'bug-report',      tags: ['regression', 'needs-review'],          created: daysAgo(0)   },
    { title: 'Ticket search not returning results for older tickets', desc: 'The search function returns tickets from the last 30 days only. We need to search our entire ticket history. Older tickets do not appear in results even when searching by exact ticket ID.',                                    priority: TicketPriority.HIGH,     status: TicketStatus.OPEN,                customer: cust4,  agent: null,    cat: 'bug-report',      tags: ['ux-issue', 'enterprise'],              created: daysAgo(2)   },
    { title: 'Email reply threading broken for forwarded emails',     desc: 'When a customer forwards an email thread to create a ticket, subsequent replies go to a new ticket instead of threading into the original. This breaks our email-based support workflow.',                                       priority: TicketPriority.HIGH,     status: TicketStatus.IN_PROGRESS,         customer: cust5,  agent: agent2,  cat: 'bug-report',      tags: ['regression', 'customer-reported'],     created: daysAgo(2)   },
    { title: 'Agent performance report shows wrong resolution times', desc: 'The agent performance section in Analytics shows resolution times that are 2-3x higher than what we measure manually. Seems like the calculation includes weekends/holidays even though our SLA is business-hours only.',       priority: TicketPriority.MEDIUM,   status: TicketStatus.OPEN,                customer: cust1,  agent: null,    cat: 'bug-report',      tags: ['needs-review', 'ux-issue'],            created: daysAgo(3)   },
    { title: 'Need ability to create internal-only ticket categories', desc: 'We want to create categories that are only visible to agents and admins, not to customers. For example, an "Internal - Engineering" category for escalations that we don\'t want customers to see.',                          priority: TicketPriority.MEDIUM,   status: TicketStatus.OPEN,                customer: cust2,  agent: null,    cat: 'feature-request', tags: ['enterprise'],                          created: daysAgo(4)   },
    { title: 'Timezone display incorrect for customers in Asia',      desc: 'Customers in UTC+8 and UTC+9 timezones are seeing ticket creation times that are 8-9 hours behind. The server is storing times correctly in UTC but the frontend is not converting for their local timezone.',                  priority: TicketPriority.MEDIUM,   status: TicketStatus.IN_PROGRESS,         customer: cust3,  agent: agent3,  cat: 'bug-report',      tags: ['ux-issue', 'customer-reported'],       created: daysAgo(4)   },
    { title: 'Knowledge base articles not showing in search results',  desc: 'The knowledge base search does not surface articles even when searching exact title keywords. The article grid at /knowledge shows articles correctly but the search input returns empty.',                                      priority: TicketPriority.MEDIUM,   status: TicketStatus.OPEN,                customer: cust4,  agent: null,    cat: 'bug-report',      tags: ['ux-issue'],                            created: daysAgo(5)   },
    { title: 'Request: Slack integration for ticket notifications',   desc: 'We want to receive new ticket notifications in our #support Slack channel. Currently we have to manually check the dashboard. A Slack app that can also allow replying from Slack would be ideal.',                            priority: TicketPriority.MEDIUM,   status: TicketStatus.OPEN,                customer: cust5,  agent: null,    cat: 'integration',     tags: ['api'],                                 created: daysAgo(5)   },
    { title: 'Billing portal shows incorrect subscription tier',      desc: 'Our billing portal shows "Starter Plan" but we upgraded to Enterprise 6 months ago. All Enterprise features are working. This seems like a display issue but it\'s confusing our finance team when auditing.',                  priority: TicketPriority.MEDIUM,   status: TicketStatus.WAITING_ON_CUSTOMER, customer: cust1,  agent: agent2,  cat: 'billing',         tags: ['needs-review'],                        created: daysAgo(6)   },
    { title: 'Custom SLA not applying to new tickets in category',    desc: 'We created a custom SLA rule for our "Enterprise" category (2h response, 8h resolution) but new tickets created in that category still use the default Medium SLA. The rule is active in the SLA settings.',                  priority: TicketPriority.MEDIUM,   status: TicketStatus.IN_PROGRESS,         customer: cust2,  agent: agent1,  cat: 'bug-report',      tags: ['regression', 'enterprise'],            created: daysAgo(7)   },
    { title: 'Request: Agent collision detection',                    desc: 'We frequently have two agents replying to the same ticket at the same time, causing duplicate responses. Can you add a "typing indicator" or "agent is viewing" notification to prevent this?',                               priority: TicketPriority.LOW,      status: TicketStatus.OPEN,                customer: cust3,  agent: null,    cat: 'feature-request', tags: ['ux-issue'],                            created: daysAgo(8)   },
    { title: 'Incorrect character encoding in exported CSV files',    desc: 'CSV exports contain garbled characters for non-ASCII content (Japanese, Arabic, French accents). The in-app display is correct. The issue is with the CSV encoding — should be UTF-8 with BOM.',                              priority: TicketPriority.LOW,      status: TicketStatus.RESOLVED,            customer: cust4,  agent: agent3,  cat: 'bug-report',      tags: ['customer-reported'],                   created: daysAgo(10), resolved: daysAgo(8) },
    { title: 'Can I export knowledge base to PDF?',                   desc: 'We want to create a printed support handbook from our knowledge base articles. Is there an export-to-PDF feature? If not, can you add it to the roadmap?',                                                                     priority: TicketPriority.LOW,      status: TicketStatus.CLOSED,              customer: cust5,  agent: agent2,  cat: 'feature-request', tags: ['documentation'],                       created: daysAgo(12), resolved: daysAgo(10) },
    { title: 'Agent portal very slow on Firefox 124',                 desc: 'The support portal has significant UI lag specifically on Firefox 124. Chrome, Safari, and Edge work fine. Scrolling the ticket list and opening modals takes 2-4 seconds. Affects our Windows team.',                         priority: TicketPriority.LOW,      status: TicketStatus.IN_PROGRESS,         customer: cust1,  agent: agent3,  cat: 'performance',     tags: ['needs-review', 'desktop'],             created: daysAgo(11)  },
    { title: 'Request: Time tracking for tickets',                    desc: 'Our billing is time-based and we need to track how long agents spend on each ticket. Can you add a built-in time tracker that records time per agent per ticket? Jira and Zendesk both offer this.',                          priority: TicketPriority.LOW,      status: TicketStatus.OPEN,                customer: cust2,  agent: null,    cat: 'feature-request', tags: ['enterprise'],                          created: daysAgo(13)  },
    { title: 'Notification bell shows wrong unread count',            desc: 'The notification bell shows "24" unread notifications but when I open the panel there are only 3. The counter does not reset when I mark notifications as read.',                                                               priority: TicketPriority.LOW,      status: TicketStatus.RESOLVED,            customer: cust3,  agent: agent1,  cat: 'bug-report',      tags: ['ux-issue'],                            created: daysAgo(16), resolved: daysAgo(13) },
    { title: 'PDF invoice does not include purchase order number',    desc: 'Our procurement team requires a PO number on all invoices for payment processing. We added the PO number in billing settings but it does not appear on the generated PDF invoice.',                                            priority: TicketPriority.LOW,      status: TicketStatus.CLOSED,              customer: cust4,  agent: agent2,  cat: 'billing',         tags: ['enterprise', 'needs-review'],          created: daysAgo(18), resolved: daysAgo(16) },
    { title: 'Request for dedicated support contact',                 desc: 'As an enterprise customer, we\'d like to have a named account manager and dedicated support email. Our contract mentions enterprise support but we\'ve been going through the general queue.',                                  priority: TicketPriority.LOW,      status: TicketStatus.CLOSED,              customer: cust5,  agent: superAdmin, cat: 'general-inquiry', tags: ['enterprise'],                          created: daysAgo(25), resolved: daysAgo(22) },
  ];

  const createdTickets = [];
  for (const t of ticketSeeds) {
    const ticket = await prisma.ticket.create({
      data: {
        title:         t.title,
        description:   t.desc,
        priority:      t.priority,
        status:        t.status,
        customerId:    t.customer.id,
        assignedToId:  t.agent?.id ?? null,
        categoryId:    catMap[t.cat]?.id ?? null,
        createdAt:     t.created,
        resolvedAt:    t.resolved ?? null,
        slaBreached:   t.slaBreached ?? false,
      },
    });
    await prisma.activityLog.create({
      data: { action: 'ticket.created', details: { title: t.title }, ticketId: ticket.id, userId: t.customer.id, createdAt: t.created },
    });
    if (t.agent) {
      await prisma.activityLog.create({
        data: { action: 'ticket.assigned', details: { agent: t.agent.name }, ticketId: ticket.id, userId: superAdmin.id, createdAt: new Date(t.created.getTime() + 300000) },
      });
    }
    for (const tagName of t.tags) {
      if (tagMap[tagName]) {
        await prisma.ticketTag.create({ data: { ticketId: ticket.id, tagId: tagMap[tagName].id } });
      }
    }
    createdTickets.push(ticket);
  }
  console.log(`  ✅ ${createdTickets.length} tickets with tags and activity logs`);

  /* ─── Comments ─── */

  const commentData: { idx: number; content: string; authorId: string; isInternal: boolean; hoursAgo: number }[] = [
    // Ticket 0: DB connection pool
    { idx: 0, content: 'This is severely impacting our operations. We have 50+ agents unable to work. Is there an ETA for resolution?', authorId: cust1.id, isInternal: false, hoursAgo: 3 },
    { idx: 0, content: 'I\'ve identified the issue — connection pool config was changed in the latest deploy. Rolling back now. ETA 15 minutes.', authorId: agent1.id, isInternal: false, hoursAgo: 2 },
    { idx: 0, content: 'Root cause: max_pool_size was accidentally set to 5 instead of 50 in the deploy config. Fixed in hotfix-2024-03. Monitoring for 30 minutes before closing.', authorId: agent1.id, isInternal: true, hoursAgo: 1 },
    // Ticket 1: Security OAuth
    { idx: 1, content: 'We discovered this during our quarterly security audit. We have logs showing a token used 2 hours after the user logged out. I can share the log extract if helpful.', authorId: cust2.id, isInternal: false, hoursAgo: 5 },
    { idx: 1, content: 'This is being treated as P0. Security team is on it. Do not share the log extract via this channel — please send to security@nexttickets.com directly.', authorId: superAdmin.id, isInternal: false, hoursAgo: 4 },
    { idx: 1, content: 'CVE being drafted. Patch ready for review in PR #2847. Needs security team sign-off before deployment.', authorId: agent3.id, isInternal: true, hoursAgo: 2 },
    // Ticket 2: Invoice double-charge
    { idx: 2, content: 'Order confirmation emails: March 15 08:32 UTC (INV-5821) and March 15 08:34 UTC (INV-5822). Both show $1,299. Our credit card was charged twice.', authorId: cust3.id, isInternal: false, hoursAgo: 20 },
    { idx: 2, content: 'I can see both charges in our payment system. This was caused by a payment webhook duplication bug. I am processing a full refund of $1,299 now — 3-5 business days.', authorId: agent2.id, isInternal: false, hoursAgo: 18 },
    // Ticket 3: API rate limiting
    { idx: 3, content: 'We are using the /v2/tickets/batch endpoint. Here\'s a sample request that triggers 429: [curl example attached]. We are sending ~200 requests/minute which should be within our unlimited tier limits.', authorId: cust4.id, isInternal: false, hoursAgo: 22 },
    { idx: 3, content: 'Confirmed — the rate limit config for enterprise tier was not updated when we deployed v2.4. Temporary workaround: add header X-Force-Tier: enterprise to your requests. Permanent fix deploying tonight.', authorId: agent1.id, isInternal: false, hoursAgo: 20 },
    // Ticket 6: SSO broken
    { idx: 6, content: 'Can you update the ACS URL in your SAML config from acme.com to acme-corp.io and send us a new metadata XML? We\'ll update on our end immediately.', authorId: agent1.id, isInternal: false, hoursAgo: 40 },
    { idx: 6, content: 'We updated the metadata and sent a new XML. Please check if you\'ve received it at sso-admin@acme-corp.io.', authorId: cust2.id, isInternal: false, hoursAgo: 36 },
    // Ticket 7: Dashboard dates
    { idx: 7, content: 'Reproduced! The date filter uses local timezone for display but UTC for DB queries, causing a mismatch for users in UTC+X timezones. Fix involves normalizing queries to UTC. PR incoming.', authorId: agent2.id, isInternal: true, hoursAgo: 60 },
    // Ticket 15: Dark mode
    { idx: 15, content: 'Thanks for the report! This was fixed in version 2.3.1. The editor now respects the system color scheme. Please update your app.', authorId: agent1.id, isInternal: false, hoursAgo: 100 },
    { idx: 15, content: 'Updated to 2.3.1 and the issue is resolved. Thanks for the quick fix!', authorId: cust1.id, isInternal: false, hoursAgo: 90 },
  ];

  for (const c of commentData) {
    const ticket = createdTickets[c.idx];
    if (!ticket) continue;
    await prisma.ticketComment.create({
      data: { content: c.content, isInternal: c.isInternal, ticketId: ticket.id, authorId: c.authorId, createdAt: new Date(Date.now() - c.hoursAgo * 3600000) },
    });
  }
  console.log('  ✅ Comments added');

  /* ─── Knowledge Articles ─── */

  const articles = [
    {
      title:   'Getting started with open-tickets',
      slug:    'getting-started',
      excerpt: 'A complete guide to setting up your workspace and creating your first ticket.',
      cat:     'general-inquiry',
      helpful: 42,
      content: `<h2>Welcome to open-tickets</h2>
<p>This guide will help you get started with your new support workspace in under 10 minutes.</p>
<h3>Step 1: Set up your workspace</h3>
<p>After logging in, navigate to <strong>Admin → Settings</strong> to configure your workspace name, timezone, and notification preferences.</p>
<h3>Step 2: Invite your team</h3>
<p>Go to <strong>Admin → Users</strong> and click <strong>Create User</strong>. You can invite agents (who handle tickets) and customers (who submit tickets).</p>
<h3>Step 3: Create categories</h3>
<p>Categories help organize your tickets. Common examples: Bug Report, Feature Request, Billing. Create them under <strong>Admin → Categories</strong>.</p>
<h3>Step 4: Your first ticket</h3>
<p>Click the <strong>New ticket</strong> button in the top right, fill in the title and description, and assign a priority. Your team will be notified automatically.</p>`,
    },
    {
      title:   'Understanding ticket priorities',
      slug:    'ticket-priorities',
      excerpt: 'Learn how ticket priority levels work and best practices for triaging.',
      cat:     'general-inquiry',
      helpful: 31,
      content: `<h2>Ticket Priority Levels</h2>
<p>Priority levels help your team focus on the most critical issues first. Each level has an associated SLA commitment.</p>
<h3>🔴 Critical</h3>
<p>System outages, security vulnerabilities, or data loss. Response within <strong>1 hour</strong>, resolution within <strong>4 hours</strong>.</p>
<h3>🟠 High</h3>
<p>Major functionality impaired, affecting multiple users or enterprise customers. Response within <strong>4 hours</strong>, resolution within <strong>24 hours</strong>.</p>
<h3>🟡 Medium</h3>
<p>Standard issues affecting a feature but with a workaround available. Response within <strong>24 hours</strong>, resolution within <strong>72 hours</strong>.</p>
<h3>🟢 Low</h3>
<p>Minor issues, cosmetic bugs, or feature requests. Response within <strong>48 hours</strong>, resolution within <strong>7 days</strong>.</p>
<h3>Best practices</h3>
<ul><li>When in doubt, escalate priority rather than downgrade</li><li>Reassess priority when new information is provided</li><li>Customer impact should drive priority, not internal convenience</li></ul>`,
    },
    {
      title:   'How to configure SLA rules',
      slug:    'sla-configuration',
      excerpt: 'Set up Service Level Agreements to ensure timely ticket resolution.',
      cat:     'general-inquiry',
      helpful: 19,
      content: `<h2>Service Level Agreements (SLA)</h2>
<p>SLA rules define response and resolution time commitments for your tickets based on priority.</p>
<h3>Creating an SLA rule</h3>
<ol><li>Navigate to <strong>SLA → Rules</strong></li><li>Click <strong>New Rule</strong></li><li>Set a name, description, and target priority</li><li>Define <strong>First Response Hours</strong> (time to first agent reply)</li><li>Define <strong>Resolution Hours</strong> (time to close the ticket)</li></ol>
<h3>How SLA tracking works</h3>
<p>When a ticket is created, the system automatically calculates the SLA due date based on the ticket's priority. If the first response or resolution deadline is missed, the ticket is marked as <strong>SLA Breached</strong>.</p>
<h3>Monitoring compliance</h3>
<p>The <strong>SLA Dashboard</strong> shows your team's compliance rate by priority level. Aim for 95%+ compliance on critical and high priority tickets.</p>`,
    },
    {
      title:   'Setting up automation rules',
      slug:    'automation-rules',
      excerpt: 'Automate repetitive tasks with trigger-based workflows.',
      cat:     'feature-request',
      helpful: 28,
      content: `<h2>Automation Rules</h2>
<p>Automations let you define "if-then" workflows that execute automatically when conditions are met.</p>
<h3>Anatomy of an automation rule</h3>
<ul><li><strong>Trigger:</strong> The event that starts the automation (e.g., ticket created, status changed)</li><li><strong>Conditions:</strong> Optional filters (e.g., only if priority is Critical)</li><li><strong>Actions:</strong> What to do (e.g., assign to agent, send notification, set priority)</li></ul>
<h3>Common automation examples</h3>
<h4>Auto-assign by category</h4>
<p>Trigger: ticket.created | Condition: category = Billing | Action: assign to billing agent</p>
<h4>Escalation on SLA breach</h4>
<p>Trigger: sla.breached | Action: set priority to High + notify team lead</p>
<h4>Auto-close stale tickets</h4>
<p>Trigger: ticket.updated | Condition: status = Resolved | Action: set status to Closed</p>`,
    },
    {
      title:   'Resetting your password',
      slug:    'reset-password',
      excerpt: 'Step-by-step guide to reset your account password.',
      cat:     'account-access',
      helpful: 67,
      content: `<h2>How to Reset Your Password</h2>
<ol><li>Go to the login page</li><li>Click <strong>Forgot password?</strong></li><li>Enter your email address</li><li>Check your inbox for a reset link (check spam if not received within 5 minutes)</li><li>Click the link — it expires in 1 hour</li><li>Enter and confirm your new password (minimum 8 characters, 1 uppercase, 1 number)</li></ol>
<h3>Didn't receive the email?</h3>
<ul><li>Check your spam/junk folder</li><li>Verify you are using the email associated with your account</li><li>Contact support if the issue persists</li></ul>
<h3>Password requirements</h3>
<ul><li>Minimum 8 characters</li><li>At least 1 uppercase letter</li><li>At least 1 number</li><li>Special characters are allowed but not required</li></ul>`,
    },
    {
      title:   'API authentication and rate limits',
      slug:    'api-authentication',
      excerpt: 'Learn how to authenticate with the API and understand rate limiting.',
      cat:     'integration',
      helpful: 44,
      content: `<h2>API Authentication</h2>
<p>The open-tickets API uses Bearer token authentication (JWT).</p>
<h3>Obtaining a token</h3>
<pre><code>POST /api/auth/login
{ "email": "user@example.com", "password": "..." }
→ { "accessToken": "eyJ...", "refreshToken": "..." }</code></pre>
<h3>Using the token</h3>
<pre><code>GET /api/tickets
Authorization: Bearer eyJ...</code></pre>
<h3>Rate limits</h3>
<table><tr><th>Tier</th><th>Requests/min</th></tr><tr><td>Free</td><td>60</td></tr><tr><td>Pro</td><td>300</td></tr><tr><td>Enterprise</td><td>Unlimited</td></tr></table>
<h3>Handling 429 errors</h3>
<p>When rate limited, the response includes a <code>Retry-After</code> header with the seconds to wait. Implement exponential backoff in your integration.</p>`,
    },
    {
      title:   'Exporting data and reports',
      slug:    'data-exports',
      excerpt: 'Export tickets, analytics, and SLA data to CSV or PDF.',
      cat:     'feature-request',
      helpful: 23,
      content: `<h2>Data Export Options</h2>
<p>You can export data from multiple sections of the platform.</p>
<h3>Ticket exports</h3>
<p>Go to <strong>Tickets → </strong> click the export icon → choose CSV or JSON. Filters applied to the current view are preserved in the export.</p>
<h3>Analytics exports</h3>
<p>The Analytics page includes an <strong>Export CSV</strong> button for each chart. Available reports:</p>
<ul><li>Ticket volume by day/week/month</li><li>Agent performance metrics</li><li>SLA compliance rate</li><li>Category breakdown</li></ul>
<h3>SLA report</h3>
<p>Navigate to <strong>SLA Dashboard → Export</strong> for a compliance report covering first response and resolution times by priority and agent.</p>`,
    },
    {
      title:   'Troubleshooting webhook integrations',
      slug:    'webhook-troubleshooting',
      excerpt: 'Debug common issues with webhook delivery and event handling.',
      cat:     'integration',
      helpful: 16,
      content: `<h2>Webhook Troubleshooting Guide</h2>
<h3>Verifying your endpoint</h3>
<p>Use the <strong>Test Webhook</strong> button in Integration settings to send a test ping. A 200 response confirms the endpoint is reachable.</p>
<h3>Common issues</h3>
<h4>Not receiving events</h4>
<ul><li>Check that the webhook is enabled and the event types are selected</li><li>Verify your endpoint returns 200 within 5 seconds (otherwise it's marked as failed)</li><li>Check the webhook delivery log for failed attempts</li></ul>
<h4>Duplicate events</h4>
<p>Webhooks may be delivered more than once. Use the <code>X-Webhook-ID</code> header to deduplicate events on your end.</p>
<h4>Signature verification</h4>
<p>All webhook payloads are signed with HMAC-SHA256. Verify the <code>X-Webhook-Signature</code> header using your webhook secret.</p>`,
    },
    {
      title:   'Managing user roles and permissions',
      slug:    'user-roles',
      excerpt: 'Understand the four role types and what each can access.',
      cat:     'account-access',
      helpful: 35,
      content: `<h2>User Roles</h2>
<h3>Super Admin</h3>
<p>Full access to everything including user management, billing, and system configuration. One per workspace (the owner).</p>
<h3>Admin</h3>
<p>Can manage users, categories, SLA rules, and automations. Cannot access billing or delete the workspace.</p>
<h3>Agent</h3>
<p>Can view, respond to, and resolve tickets. Can create knowledge base articles. Cannot manage users or system settings.</p>
<h3>Customer</h3>
<p>Can only view and reply to their own tickets. Can read published knowledge base articles.</p>
<h3>Changing a user's role</h3>
<ol><li>Go to <strong>Admin → Users</strong></li><li>Click the edit icon next to the user</li><li>Select the new role from the dropdown</li><li>Click <strong>Save Changes</strong></li></ol>`,
    },
    {
      title:   'SLA compliance best practices',
      slug:    'sla-best-practices',
      excerpt: 'Proven strategies to improve your SLA compliance rate.',
      cat:     'general-inquiry',
      helpful: 12,
      content: `<h2>Improving SLA Compliance</h2>
<h3>Monitor the SLA Dashboard daily</h3>
<p>The SLA Dashboard shows tickets at risk before they breach. Review it at the start of each shift and triage accordingly.</p>
<h3>Use automation to prevent breaches</h3>
<ul><li>Set up an automation that notifies the team lead 2 hours before SLA expiry</li><li>Auto-escalate tickets that have been open longer than 80% of the allowed response time</li></ul>
<h3>Set realistic SLA targets</h3>
<p>Start conservatively — 95% compliance at 48h is better than 70% compliance at 24h. Review and adjust targets quarterly based on actual performance data.</p>
<h3>Reduce time-to-first-response</h3>
<p>First response time is the most impactful metric. Use automations to send an acknowledgment reply immediately when a critical ticket is created, satisfying the first response SLA while the team investigates.</p>`,
    },
    {
      title:   'Setting up two-factor authentication',
      slug:    'two-factor-authentication',
      excerpt: 'Secure your account with TOTP-based two-factor authentication.',
      cat:     'account-access',
      helpful: 29,
      content: `<h2>Two-Factor Authentication (2FA)</h2>
<p>2FA adds an extra layer of security by requiring a one-time code in addition to your password.</p>
<h3>Enabling 2FA</h3>
<ol><li>Go to <strong>Settings → Security</strong></li><li>Click <strong>Enable 2FA</strong></li><li>Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password)</li><li>Enter the 6-digit code to confirm setup</li><li>Save your backup codes in a secure location</li></ol>
<h3>Using backup codes</h3>
<p>If you lose access to your authenticator app, use one of your 10 single-use backup codes. Each code can only be used once. Generate new codes from Settings after using them.</p>
<h3>Disabling 2FA</h3>
<p>Go to <strong>Settings → Security → Disable 2FA</strong>. You'll need to enter your current 2FA code to confirm.</p>`,
    },
    {
      title:   'Understanding the Analytics dashboard',
      slug:    'analytics-dashboard',
      excerpt: 'Navigate and interpret the key metrics in your analytics overview.',
      cat:     'general-inquiry',
      helpful: 21,
      content: `<h2>Analytics Dashboard Guide</h2>
<h3>Overview tab</h3>
<p>Shows high-level KPIs: total tickets, open tickets, resolved this week, average first response time, and SLA compliance rate.</p>
<h3>Trends tab</h3>
<p>A time-series chart showing ticket volume over the selected period. Use the date picker to compare different time ranges.</p>
<h3>Agent performance tab</h3>
<p>Compares agents on: tickets handled, average resolution time, first response time, and customer satisfaction score.</p>
<h3>Heatmap tab</h3>
<p>Shows ticket volume by day of week and hour. Use this to identify peak hours and optimize staffing.</p>
<h3>Date filters</h3>
<p>All charts respect the global date filter. Presets: Last 7 days, Last 30 days, Last 90 days, Custom range.</p>`,
    },
    {
      title:   'How to merge duplicate tickets',
      slug:    'merging-duplicate-tickets',
      excerpt: 'Combine duplicate tickets to avoid split conversations.',
      cat:     'general-inquiry',
      helpful: 18,
      content: `<h2>Merging Duplicate Tickets</h2>
<p>When two tickets describe the same issue, merging keeps the conversation in one place.</p>
<h3>How to merge</h3>
<ol><li>Open the ticket you want to keep as the primary ticket</li><li>Click the <strong>Actions</strong> menu (⋯) in the top right</li><li>Select <strong>Merge ticket</strong></li><li>Search for the duplicate ticket by ID or title</li><li>Confirm the merge</li></ol>
<h3>What happens after merging</h3>
<ul><li>All comments from the merged ticket are copied to the primary ticket</li><li>The merged ticket is closed and marked as a duplicate</li><li>A note is added explaining which ticket it was merged into</li><li>The original customer is notified that their ticket was merged</li></ul>`,
    },
    {
      title:   'Configuring email notifications',
      slug:    'email-notifications',
      excerpt: 'Control which notifications you and your team receive by email.',
      cat:     'account-access',
      helpful: 33,
      content: `<h2>Email Notification Settings</h2>
<h3>Personal notification preferences</h3>
<p>Go to <strong>Settings → Notifications</strong> to control which events send you email:</p>
<ul><li>New ticket assigned to me</li><li>Reply on my ticket</li><li>SLA about to breach (1 hour warning)</li><li>Ticket status change</li><li>Mention in comment</li></ul>
<h3>Team-wide notification settings (Admin only)</h3>
<p>Admins can configure workspace-level notifications under <strong>Admin → Notifications</strong>.</p>
<h3>Turning off all notifications</h3>
<p>You can unsubscribe from all non-critical notifications from Settings. Critical alerts (SLA breach, security events) cannot be disabled.</p>
<h3>Notification frequency</h3>
<p>Choose between immediate delivery or a daily digest email at a configurable time.</p>`,
    },
    {
      title:   'Ticket tagging and organization',
      slug:    'ticket-tagging',
      excerpt: 'Use tags to organize and filter tickets effectively.',
      cat:     'general-inquiry',
      helpful: 14,
      content: `<h2>Using Tags in Tickets</h2>
<p>Tags provide flexible, cross-cutting organization beyond categories. A ticket can have multiple tags.</p>
<h3>Adding tags to a ticket</h3>
<p>Open a ticket and click the <strong>Tags</strong> field. Type to search existing tags or create a new one by typing a name and pressing Enter.</p>
<h3>Creating tag conventions</h3>
<p>Agree on a tag naming convention with your team to keep things consistent. Common approaches:</p>
<ul><li><strong>priority tags:</strong> sla-risk, urgent, enterprise</li><li><strong>type tags:</strong> regression, documentation, api</li><li><strong>status tags:</strong> needs-review, wont-fix, duplicate</li></ul>
<h3>Filtering by tags</h3>
<p>In the ticket list, use the filter panel to select one or multiple tags. The list will show only tickets matching all selected tags.</p>`,
    },
    {
      title:   'Integrating with Zapier and Make',
      slug:    'zapier-make-integration',
      excerpt: 'Connect open-tickets to 5,000+ apps via Zapier and Make.com.',
      cat:     'integration',
      helpful: 26,
      content: `<h2>Zapier and Make Integration</h2>
<p>Use our Zapier and Make.com integrations to connect open-tickets to thousands of other tools without writing code.</p>
<h3>Available Zapier triggers</h3>
<ul><li>New ticket created</li><li>Ticket status changed</li><li>New comment added</li><li>SLA breached</li></ul>
<h3>Available Zapier actions</h3>
<ul><li>Create a ticket</li><li>Update ticket status</li><li>Add a comment</li><li>Assign ticket to agent</li></ul>
<h3>Getting your API key</h3>
<p>Go to <strong>Settings → Integrations → API Keys</strong>. Create a new key and paste it into the Zapier or Make.com authentication step.</p>
<h3>Example: Create a ticket from a Typeform submission</h3>
<p>Trigger: New Typeform entry → Action: Create ticket in open-tickets with Typeform fields mapped to title/description.</p>`,
    },
    {
      title:   'Managing ticket attachments and files',
      slug:    'ticket-attachments',
      excerpt: 'Upload, view, and manage file attachments in tickets.',
      cat:     'general-inquiry',
      helpful: 9,
      content: `<h2>File Attachments</h2>
<h3>Supported file types</h3>
<p>You can attach any file type up to <strong>25MB</strong> per attachment. Common types: images (PNG, JPG, GIF), documents (PDF, DOCX), archives (ZIP), logs (TXT, LOG, CSV).</p>
<h3>Adding an attachment</h3>
<p>In the comment editor, click the paperclip icon or drag and drop a file. Multiple files can be uploaded at once.</p>
<h3>Viewing attachments</h3>
<p>Images are previewed inline in the comment thread. Other files show as download links. Click any attachment to download it.</p>
<h3>Deleting attachments</h3>
<p>Only the uploader or an admin can delete an attachment. Hover over the attachment and click the trash icon.</p>
<h3>Storage limits</h3>
<p>Free: 1GB total | Pro: 10GB | Enterprise: Unlimited</p>`,
    },
    {
      title:   'Understanding ticket statuses',
      slug:    'ticket-statuses',
      excerpt: 'What each ticket status means and when to use it.',
      cat:     'general-inquiry',
      helpful: 38,
      content: `<h2>Ticket Status Guide</h2>
<h3>Open</h3>
<p>The ticket has been submitted but no agent has started working on it yet. This is the default status for all new tickets.</p>
<h3>In Progress</h3>
<p>An agent has taken ownership of the ticket and is actively working on it. The customer sees this as "Being worked on."</p>
<h3>Waiting on Customer</h3>
<p>The agent has replied and is waiting for more information from the customer. SLA clock pauses in this state (configurable).</p>
<h3>Resolved</h3>
<p>The agent believes the issue is fixed. The customer receives an email asking them to confirm. If no response in 7 days, the ticket auto-closes.</p>
<h3>Closed</h3>
<p>The ticket is fully resolved and archived. Customers can re-open a closed ticket by replying to the resolution email within 30 days.</p>`,
    },
    {
      title:   'Setting up the customer portal',
      slug:    'customer-portal',
      excerpt: 'Let customers submit and track tickets through a branded portal.',
      cat:     'feature-request',
      helpful: 17,
      content: `<h2>Customer Portal Setup</h2>
<p>The customer portal is a standalone page where your customers can submit tickets, track their status, and read knowledge base articles.</p>
<h3>Enabling the portal</h3>
<ol><li>Go to <strong>Admin → Customer Portal</strong></li><li>Toggle <strong>Enable Portal</strong> to on</li><li>Set your custom domain (e.g., support.yourcompany.com) or use the provided subdomain</li><li>Upload your logo and set brand colors</li></ol>
<h3>Portal features</h3>
<ul><li>Ticket submission form with custom fields</li><li>Real-time ticket status tracking</li><li>Email notifications for status changes</li><li>Knowledge base article search</li><li>Optional: customer account creation</li></ul>
<h3>Guest vs registered submissions</h3>
<p>You can allow guests (email-only, no account required) or require registration. Registered customers can view all their ticket history.</p>`,
    },
  ];

  for (const a of articles) {
    await prisma.knowledgeArticle.create({
      data: {
        title:          a.title,
        slug:           a.slug,
        excerpt:        a.excerpt,
        content:        a.content,
        published:      true,
        helpfulCount:   a.helpful,
        notHelpfulCount: Math.floor(a.helpful * 0.05),
        categoryId:     catMap[a.cat]?.id ?? null,
        authorId:       superAdmin.id,
      },
    });
  }
  console.log(`  ✅ ${articles.length} knowledge articles created`);

  console.log('\n✨ Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Super Admin: admin@nexttickets.com  / Admin123!');
  console.log('  Admin:       admin2@nexttickets.com / Admin123!');
  console.log('  Agent:       sara@nexttickets.com   / Admin123!');
  console.log('  Customer:    tyler@acme.com         / Admin123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
