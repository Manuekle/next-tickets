import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../ai.service';

const SYSTEM_BASE = 'You are an expert customer support copilot embedded inside a ticket management platform. Be concise, accurate, and never invent facts.';

@Injectable()
export class CopilotService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  private async loadTicketContext(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: { select: { name: true, email: true } },
        assignedTo: { select: { name: true } },
        category: { select: { name: true } },
        comments: { orderBy: { createdAt: 'asc' }, take: 50, include: { author: { select: { name: true, role: true } } } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  private formatTicketAsText(ticket: any): string {
    const lines: string[] = [];
    lines.push(`Title: ${ticket.title}`);
    lines.push(`Status: ${ticket.status} | Priority: ${ticket.priority}`);
    if (ticket.category) lines.push(`Category: ${ticket.category.name}`);
    lines.push(`Customer: ${ticket.customer.name} (${ticket.customer.email})`);
    if (ticket.assignedTo) lines.push(`Assigned to: ${ticket.assignedTo.name}`);
    lines.push(`\nDescription:\n${ticket.description}`);
    if (ticket.comments?.length) {
      lines.push(`\n--- Conversation ---`);
      for (const c of ticket.comments) {
        const label = c.isInternal ? '[INTERNAL]' : '';
        lines.push(`${label} ${c.author.name} (${c.author.role}): ${c.content}`);
      }
    }
    return lines.join('\n');
  }

  async summarize(userId: string, ticketId: string) {
    const ticket = await this.loadTicketContext(ticketId);
    const prompt = `Summarize the following support ticket in 3 short bullet points. Include: customer issue, current state, next action.\n\n${this.formatTicketAsText(ticket)}`;
    const result = await this.ai.run(userId, 'summarize', { system: SYSTEM_BASE, prompt, maxTokens: 400 });
    return { ticketId, summary: result.content, model: result.model };
  }

  async suggestReply(userId: string, ticketId: string, tone: 'formal' | 'friendly' | 'apologetic' = 'friendly') {
    const ticket = await this.loadTicketContext(ticketId);
    const prompt = `Draft a ${tone} reply for the support agent to send to the customer. Address the customer's latest concern directly. Do NOT include greeting if conversation already started. Output reply text only, no preamble.\n\n${this.formatTicketAsText(ticket)}`;
    const result = await this.ai.run(userId, 'suggest-reply', { system: SYSTEM_BASE, prompt, maxTokens: 600, temperature: 0.6 });
    return { ticketId, reply: result.content, tone, model: result.model };
  }

  async classify(userId: string, ticketId: string) {
    const ticket = await this.loadTicketContext(ticketId);
    const categories = await this.prisma.category.findMany({ where: { isActive: true }, select: { name: true } });
    const categoryList = categories.map((c) => c.name).join(', ') || 'General';
    const prompt = `Classify the ticket. Respond ONLY as JSON: {"priority":"LOW|MEDIUM|HIGH|CRITICAL","category":"<from list>","reason":"<short>"}.\n\nAllowed categories: ${categoryList}\n\n${this.formatTicketAsText(ticket)}`;
    const result = await this.ai.run(userId, 'classify', { system: SYSTEM_BASE, prompt, maxTokens: 200, temperature: 0.1 });
    let parsed: any = {};
    try { parsed = JSON.parse(result.content.replace(/```json|```/g, '').trim()); } catch { parsed = { raw: result.content }; }
    return { ticketId, ...parsed, model: result.model };
  }

  async detectDuplicates(userId: string, ticketId: string) {
    const ticket = await this.loadTicketContext(ticketId);
    const candidates = await this.prisma.ticket.findMany({
      where: {
        id: { not: ticketId },
        status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, title: true, description: true },
    });
    if (candidates.length === 0) return { ticketId, duplicates: [] };

    const list = candidates.map((c, i) => `${i + 1}. [${c.id}] ${c.title}\n${c.description.slice(0, 300)}`).join('\n\n');
    const prompt = `Find up to 3 tickets in the list below that are likely duplicates of the target ticket. Respond ONLY as JSON: {"duplicates":[{"id":"<ticketId>","similarity":0-1,"reason":"<short>"}]}. Empty array if none.\n\nTarget:\n${this.formatTicketAsText(ticket)}\n\nCandidates:\n${list}`;
    const result = await this.ai.run(userId, 'detect-duplicates', { system: SYSTEM_BASE, prompt, maxTokens: 600, temperature: 0.1 });
    let parsed: any = { duplicates: [] };
    try { parsed = JSON.parse(result.content.replace(/```json|```/g, '').trim()); } catch {}
    return { ticketId, duplicates: parsed.duplicates ?? [], model: result.model };
  }

  async generateFaq(userId: string, ticketId: string) {
    const ticket = await this.loadTicketContext(ticketId);
    const prompt = `From this resolved ticket, generate a knowledge base FAQ entry. Respond ONLY as JSON: {"title":"<question>","content":"<markdown answer with steps if relevant>","excerpt":"<1 sentence>"}.\n\n${this.formatTicketAsText(ticket)}`;
    const result = await this.ai.run(userId, 'generate-faq', { system: SYSTEM_BASE, prompt, maxTokens: 800, temperature: 0.3 });
    let parsed: any = {};
    try { parsed = JSON.parse(result.content.replace(/```json|```/g, '').trim()); } catch { parsed = { raw: result.content }; }
    return { ticketId, ...parsed, model: result.model };
  }
}
