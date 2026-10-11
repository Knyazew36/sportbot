import { Module } from '@nestjs/common';

import { UploadModule } from '../upload/upload.module';
import { AuthModule } from '../auth/auth.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AuthModule, UploadModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
