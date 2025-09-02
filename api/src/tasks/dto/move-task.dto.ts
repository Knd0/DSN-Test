import { IsEnum } from 'class-validator';
import { Column } from '../task-column.enum';

export class MoveTaskDto {
  @IsEnum(Column)
  column: Column;
}
