import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UnsubscribeDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'Symbols array is required' })
  symbols: string[];
}
