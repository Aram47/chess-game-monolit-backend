export interface MakeMoveLuaResult extends Array<any> {
  0: 'OK';
  1: number; // new version
  2: number; // isGameOver (0 | 1)
}
