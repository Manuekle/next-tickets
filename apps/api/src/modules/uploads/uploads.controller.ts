import { Controller, Post, Delete, Param, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^(image\/|application\/pdf|text\/)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadsService.upload(file);
  }

  @Delete(':key')
  @Roles(Role.ADMIN, Role.AGENT)
  delete(@Param('key') key: string) {
    return this.uploadsService.delete(key);
  }
}
