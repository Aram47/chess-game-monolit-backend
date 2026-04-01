import type { MoveType } from './move.type';

export type AnalysisEvaluationKind = 'cp' | 'mate';

export type AnalysisEvaluation = {
  kind: AnalysisEvaluationKind;
  value: number;
};

export type AnalysisEngineLine = {
  multipv: number;
  depth: number;
  evaluation: AnalysisEvaluation;
  pvUci: string[];
  move: MoveType;
};

export type MultiPvAnalysisEngineResult = {
  depthRequested: number;
  depthReached: number;
  lines: AnalysisEngineLine[];
};
