import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CopilotService } from './copilot.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('ai/copilot')
export class CopilotController {
  constructor(private copilot: CopilotService) {}

  @Post('tickets/:id/summarize')
  @HttpCode(HttpStatus.OK)
  summarize(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.copilot.summarize(userId, id);
  }

  @Post('tickets/:id/suggest-reply')
  @HttpCode(HttpStatus.OK)
  suggestReply(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('tone') tone?: 'formal' | 'friendly' | 'apologetic',
  ) {
    return this.copilot.suggestReply(userId, id, tone ?? 'friendly');
  }

  @Post('tickets/:id/classify')
  @HttpCode(HttpStatus.OK)
  classify(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.copilot.classify(userId, id);
  }

  @Post('tickets/:id/detect-duplicates')
  @HttpCode(HttpStatus.OK)
  detectDuplicates(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.copilot.detectDuplicates(userId, id);
  }

  @Post('tickets/:id/generate-faq')
  @HttpCode(HttpStatus.OK)
  generateFaq(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.copilot.generateFaq(userId, id);
  }
}
