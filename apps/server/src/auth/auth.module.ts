import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { UploadModule } from '../upload/upload.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailAuthService } from './email-auth.service';
import { EmailVerificationService } from './email-verification.service';
import { VerificationCodeService } from './verification-code.service';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]), UploadModule],
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
