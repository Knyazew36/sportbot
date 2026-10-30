import { PartialType } from '@nestjs/swagger';

import { CreateStretchRoutineDto } from './create-stretch-routine.dto';

export class UpdateStretchRoutineDto extends PartialType(
  CreateStretchRoutineDto,
) {}
