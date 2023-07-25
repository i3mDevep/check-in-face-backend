import { Entity } from 'dynamodb-toolbox';

export type GeneralFacet<E extends Entity> = Omit<
  E['_typesOnly']['_item'],
  'pk' | 'sk' | 'gs1pk' | 'gs1sk'
>;
