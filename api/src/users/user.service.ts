import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async register(name: string, email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ name, email, password: hashed });
    await this.userRepo.save(user);
    const token = this.jwtService.sign({ sub: user.id });
    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    const token = this.jwtService.sign({ sub: user.id });
    return { user, token };
  }
}
