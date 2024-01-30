import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { RoleEnum } from '../shared';
import { Public, Roles } from '../core';

@Controller('health')
// @Public()
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get()
  @Roles(RoleEnum.ADMIN)
  @HealthCheck()
  @Public()
  check() {
    return this.health.check([]);
  }
}
