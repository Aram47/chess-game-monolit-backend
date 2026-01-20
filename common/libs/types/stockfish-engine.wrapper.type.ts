import { ChildProcessWithoutNullStreams } from 'child_process';

export type StockfishEngineWrapper = {
  process: ChildProcessWithoutNullStreams;
  busy: boolean;
};
