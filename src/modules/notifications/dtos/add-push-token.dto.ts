import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AddPushTokenDto {
  @ApiProperty({ description: 'Firebase/APNs device token' })
  @IsString()
  token: string;

  @ApiPropertyOptional({
    description: 'Device platform',
    enum: ['ios', 'android', 'web'],
  })
  @IsString()
  @IsOptional()
  platform?: string;
}
