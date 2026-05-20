import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CopilotController } from './copilot/copilot.controller';
import { CopilotService } from './copilot/copilot.service';

@Module({
  controllers: [AiController, CopilotController],
  providers: [AiService, CopilotService],
  exports: [AiService, CopilotService],
})
export class AiModule {}
