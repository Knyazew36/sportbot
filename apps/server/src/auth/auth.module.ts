import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailAuthService } from './email-auth.service';
import { EmailVerificationService } from './email-verification.service';
import { VerificationCodeService } from './verification-code.service';

@Module({
  imports: [UploadModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailAuthService,
    EmailVerificationService,
    VerificationCodeService,
  ],
  exports: [AuthService, EmailAuthService, EmailVerificationService],
})
export class AuthModule {}
