// create-task.dto.ts
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsUUID, IsInt, Min } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  storyPoints: number = 1;

  @IsUUID()
  @IsOptional()
  assignedTo?: string; // id del usuario al que se asigna
}
