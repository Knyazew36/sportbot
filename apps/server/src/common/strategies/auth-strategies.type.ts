import { User } from '@/generated/prisma/client';

import {
  AuthProvider,
  RequestWithOrganization,
} from '../types/request-with-organization';

export interface AuthStrategy {
  supports(req: RequestWithOrganization): boolean;
  authenticate(req: RequestWithOrganization): Promise<User>;
  provider: AuthProvider;
}
