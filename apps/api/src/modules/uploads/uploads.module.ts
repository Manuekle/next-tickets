import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [MulterModule.register({})],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
