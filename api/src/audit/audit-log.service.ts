// audit-log.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuditLog } from '../audit/audit-log.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>
  ) {}

  createLog(data: Partial<AuditLog>) {
    const log = this.repo.create(data);
    return this.repo.save(log);
  }

  findAll() {
    return this.repo.find({ order: { timestamp: 'DESC' } });
  }

  findByTask(taskId: string) {
    return this.repo.find({ where: { taskId }, order: { timestamp: 'DESC' } });
  }
}
