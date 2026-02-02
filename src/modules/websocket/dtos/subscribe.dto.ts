import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SubscribeDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'Symbols array is required' })
  symbols: string[];
}
