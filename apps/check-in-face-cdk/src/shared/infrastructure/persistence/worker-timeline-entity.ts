/* eslint-disable @typescript-eslint/no-explicit-any */

import { Entity, Table } from 'dynamodb-toolbox';
import { checkInFaceTable } from './check-in-face-table';
import { CHECK_IN_FACE_KEYS } from './check-in-face-keys';

const { identification, year, date: dateKey, month, day } = CHECK_IN_FACE_KEYS;

type ItemsType = Record<any, string>;

const TIME_ZONE_APP = -5;

export const buildPKWorkerTimelineWithDateRegister = (
  identification_: string,
  dateRegister: string
) => {
  const date = new Date(dateRegister);
  //ISSUE [1] timezone app it is not fixed
  date.setHours(date.getHours() + TIME_ZONE_APP);
  return `${identification}#${identification_}#${year}#${date.getFullYear()}#${month}#${date.getMonth()}`;
};

export const buildSKWorkerTimelineWithDateRegister = (items: ItemsType) => {
  const date = new Date(items?.dateRegister);
  //ISSUE [2] timezone app it is not fixed
  date.setHours(date.getHours() + TIME_ZONE_APP);
  return `${day}#${date.getDate()}#${dateKey}#${date.getTime()}`;
};

export const buildPKWorkerTimelineWithManual = (
  identification_: string,
  year_: string,
  month_: string
) => `${identification}#${identification_}#${year}#${year_}#${month}#${month_}`;

export const generateWorkerTimelineEntity = <
  T extends Table<string, 'pk', 'sk'>
>(
  table: T
) =>
  new Entity({
    name: 'worker-timeline',
    attributes: {
      pk: {
        partitionKey: true,
        hidden: true,
        dependsOn: ['dateRegister', 'identification'],
        type: 'string',
        default: (items: ItemsType) =>
          buildPKWorkerTimelineWithDateRegister(
            items?.identification,
            items?.dateRegister
          ),
      },
      sk: {
        sortKey: true,
        hidden: true,
        dependsOn: ['dateRegister'],
        type: 'string',
        default: buildSKWorkerTimelineWithDateRegister,
      },
      identification: { type: 'string', required: true },
      dateRegister: { type: 'string', required: true },
      reason: { type: 'string', required: true },
      picture: { type: 'string', required: true },
      type: { type: 'string', required: true },
    },
    table,
  } as const);

export const workerTimelineEntity =
  generateWorkerTimelineEntity(checkInFaceTable);
