export const StockfishCommands = {
  GO: 'go',
  UCI: 'uci',
  STOP: 'stop',
  QUIT: 'quit',
  DEBUG: 'debug',
  ISREADY: 'isready',
  REGISTER: 'register',
  POSITION: 'position',
  SETOPTION: 'setoption',
  PONDERHIT: 'ponderhit',
  UCINEWGAME: 'ucinewgame',
};

export const StockfishResponse = {
  ID: 'id',
  UCIOK: 'uciok',
  READYOK: 'readyok',
  BESTMOVE: 'bestmove',
};

export const StockfishDefaults = {
  ENGINES_POOL_SIZE: 4,
  MOVE_TIMEOUT_MS: 2000,
  MAX_OUTPUT_BUFFER_BYTES: 65536, // 64KB
  INIT_TIMEOUT_MS: 10000, // 10s for engine to respond with readyok
  BINARY_PATH: 'stockfish',
};

export const DifficultyMovetimeMs = {
  easy: [50, 150] as const,
  medium: 300,
  hard: 600,
} as const;
