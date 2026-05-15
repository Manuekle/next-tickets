import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentSchema } from './dto/create-comment.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tickets/:ticketId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  findByTicket(@Param('ticketId') ticketId: string, @CurrentUser() user: any) {
    return this.commentsService.findByTicket(ticketId, user);
  }

  @Post()
  create(
    @Param('ticketId') ticketId: string,
    @Body(new ZodValidationPipe(CreateCommentSchema)) dto: any,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.create(dto, user.id, ticketId, user.role);
  }
}
