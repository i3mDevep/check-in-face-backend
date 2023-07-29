import { AppSyncResolverHandler } from 'aws-lambda';
import {
  workerTimelineEntity,
  CHECK_IN_FACE_KEYS,
  GeneralFacet,
  buildPKWorkerTimelineWithManual,
} from '../../../../src/shared/infrastructure/persistence';

const { day: dayKey } = CHECK_IN_FACE_KEYS;

type ResponseWorkerTimeline = GeneralFacet<typeof workerTimelineEntity>;

export const handler: AppSyncResolverHandler<
  {
    query: {
      identification: string;
      year: string;
      month: string;
      day?: string;
    };
  },
  ResponseWorkerTimeline[] | undefined
> = async (event) => {
  const { identification, month, year, day } = event.arguments.query;
  try {
    const options = day ? { beginsWith: `${dayKey}#${day}` } : undefined;
    const { Items } = await workerTimelineEntity.query(
      buildPKWorkerTimelineWithManual(identification, year, month),
      { ...options, reverse: true }
    );

    return Items;
  } catch (error) {
    return undefined;
  }
};
