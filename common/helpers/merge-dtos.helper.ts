type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export type MergePayload<T extends object[]> = UnionToIntersection<T[number]>;

export function mergeDtos<T extends object[]>(...dtos: T): MergePayload<T> {
  return Object.assign({}, ...dtos);
}
