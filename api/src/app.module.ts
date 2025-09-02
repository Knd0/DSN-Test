import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { WsGateway } from './ws.gateway';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TasksModule,
  ],
  controllers: [HealthController],
  providers: [WsGateway],
})
export class AppModule {}
