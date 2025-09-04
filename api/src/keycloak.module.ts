import { Module } from '@nestjs/common';
import { KeycloakConnectModule, AuthGuard, RoleGuard } from 'nest-keycloak-connect';

@Module({
  imports: [
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080/auth',
      realm: process.env.KEYCLOAK_REALM || 'demo',
      clientId: process.env.KEYCLOAK_CLIENT_ID || 'client-demo',
      secret: process.env.KEYCLOAK_CLIENT_SECRET || 'mysecret',
      cookieKey: 'KEYCLOAK_JWT',
    }),
  ],
  providers: [
    // Guard global opcional
    { provide: 'APP_GUARD', useClass: AuthGuard },
    { provide: 'APP_GUARD', useClass: RoleGuard },
  ],
  exports: [KeycloakConnectModule],
})
export class KeycloakModule {}
