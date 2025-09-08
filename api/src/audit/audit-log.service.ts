import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,
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
