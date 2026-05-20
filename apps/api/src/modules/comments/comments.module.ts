import { Module, forwardRef } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [forwardRef(() => TicketsModule)],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
