// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PutItemToolboxGeneral<T extends Record<string, any>> = Omit<
  T,
  'pk' | 'sk' | 'created' | 'modified' | 'entity'
>;
