import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './user.service';
import { AuthLoginDto, AuthRegisterDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: AuthRegisterDto) {
    return this.auth.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  login(@Body() dto: AuthLoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}
