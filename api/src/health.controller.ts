import { Controller, Get } from '@nestjs/common';


@Controller('health')
export class HealthController {
@Get()
get() {
return { ok: true, time: new Date().toISOString() };
}
}