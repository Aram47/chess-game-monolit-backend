export type MoveType = {
  from: string;
  to: string;
  // is user try to make promotion
  // promotion is not required
  promotion?: string;
};
