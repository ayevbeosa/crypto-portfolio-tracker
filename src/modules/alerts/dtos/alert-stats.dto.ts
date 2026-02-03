import { ApiProperty } from '@nestjs/swagger';

export class AlertStatsDto {
  @ApiProperty({ example: 15 })
  totalAlerts: number;

  @ApiProperty({ example: 8 })
  activeAlerts: number;

  @ApiProperty({ example: 5 })
  triggeredAlerts: number;

  @ApiProperty({ example: 2 })
  cancelledAlerts: number;

  @ApiProperty({ example: { BTC: 3, ETH: 2, SOL: 3 } })
  alertsByCrypto: Record<string, number>;
}
