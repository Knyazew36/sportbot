import { Module } from '@nestjs/common';

import { UploadModule } from '@/upload/upload.module';

import { AdminStretchRoutineController } from './admin-stretch-routine.controller';
import { StretchRoutineController } from './stretch-routine.controller';
import { StretchRoutineService } from './stretch-routine.service';

@Module({
  imports: [UploadModule],
  controllers: [StretchRoutineController, AdminStretchRoutineController],
  providers: [StretchRoutineService],
})
export class StretchRoutineModule {}
