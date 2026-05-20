import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateAiProviderSchema, UpdateAiProviderSchema } from './dto/ai-provider.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('providers')
  list(@CurrentUser('id') userId: string) {
    return this.aiService.list(userId);
  }

  @Post('providers')
  create(@CurrentUser('id') userId: string, @Body(new ZodValidationPipe(CreateAiProviderSchema)) dto: any) {
    return this.aiService.create(userId, dto);
  }

  @Patch('providers/:id')
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateAiProviderSchema)) dto: any) {
    return this.aiService.update(userId, id, dto);
  }

  @Delete('providers/:id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.aiService.remove(userId, id);
  }

  @Post('providers/:id/test')
  @HttpCode(HttpStatus.OK)
  test(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.aiService.test(userId, id);
  }

  @Post('providers/:id/default')
  @HttpCode(HttpStatus.OK)
  setDefault(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.aiService.setDefault(userId, id);
  }
}
