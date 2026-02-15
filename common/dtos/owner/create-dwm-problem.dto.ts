import { DWM } from '../../enums';

export class CreateDWMProblemDto {
  problemId: number;
  DWM_type: DWM;
}

export class UpdateDWMProblemDto {
  currentProblemId: number;
  newProblemId: number;
  DWM_type: DWM;
}
