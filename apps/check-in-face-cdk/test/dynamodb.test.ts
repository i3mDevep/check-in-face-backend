import {
  workerEntity,
  workerImagesEntity,
  workerTimelineEntity,
  CHECK_IN_FACE_KEYS,
  buildPKWorkerTimelineWithDateRegister,
  paymentEntity,
} from '../src/shared/infrastructure/persistence';

import { workerTracerTimeType } from '../src/worker-time/domain/worker-tracer-time.type';
const { identification, worker, faceId } = CHECK_IN_FACE_KEYS;

const paymentEntityMock = {
  baseHourDay: 1000,
  baseHourHoliday: 1500,
  extraHourNormalDay: 1,
  extraHourHoliday: 2,
  nocturnHourNormalDay: 3,
  nocturnHourHoliday: 5,
  hoursMinimum: 8,
  intervalNonNight: { since: 0, until: 60 * 6 },
};

const workerMock = {
  fullName: 'User Mock',
  identification: 'identification_mock_fake',
  info: { email: 'mocker@gmail.com' },
};

const workerImage = {
  faceId: '77d9f43a-9a4d-4669-a6e6-adc2e04e8582',
  collectionId: 'images-worker',
  identification: workerMock.identification,
  pathFaceInCollection: '/image/1',
  status: 'associated',
};

const DateOut = new Date();
DateOut.setHours(DateOut.getHours() + 1);
const workerTimeline = [
  {
    dateRegister: new Date().toISOString(),
    identification: 'identification_mock_fake',
    reason: 'start work',
    picture: '/time-line/0191',
    type: workerTracerTimeType.IN,
  },
  {
    dateRegister: DateOut.toISOString(),
    identification: 'identification_mock_fake',
    reason: 'end',
    picture: '/time-line/0191',
    type: workerTracerTimeType.OUT,
  },
];
describe('checkInFaceShared', () => {
  describe('workerEntity', () => {
    beforeAll(async () => {
      await workerEntity.put(workerMock);
    });
    afterAll(async () => {
      await workerEntity.delete({ identification: workerMock.identification });
    });
    it('should get worker', async () => {
      const { Item } = await workerEntity.get({
        identification: workerMock.identification,
      });

      expect(Item?.entity).toEqual('worker');
      expect(Item?.identification).toEqual(workerMock.identification);
    });

    it('should get workers list', async () => {
      const { Items } = await workerEntity.query(worker, {
        beginsWith: `${identification}`,
      });
      expect(Number(Items?.length) >= 1).toBe(true);
    });

    it('should update worker', async () => {
      await workerEntity.update({
        identification: workerMock.identification,
        profilePath: '/example',
      });
      const { Item } = await workerEntity.get({
        identification: workerMock.identification,
      });
      expect(Item?.profilePath).toEqual('/example');
    });

    it('should error worker repeat', async () => {
      try {
        await workerEntity.put(
          { ...workerMock },
          {
            conditions: [{ attr: 'identification', exists: false }],
          }
        );
      } catch (error) {
        expect(error.message).toContain('The conditional request failed');
      }
    });
  });

  describe('workerImagesEntity', () => {
    beforeAll(async () => {
      await workerImagesEntity.put(workerImage);
    });
    afterAll(async () => {
      await workerImagesEntity.delete({
        identification: workerImage.identification,
        faceId: workerImage.faceId,
      });
    });
    it('should get worker images', async () => {
      const { Item } = await workerImagesEntity.get({
        identification: workerImage.identification,
        faceId: workerImage.faceId,
      });

      expect(Item?.faceId).toEqual(workerImage.faceId);
      expect(Item?.pathFaceInCollection).toEqual(
        workerImage.pathFaceInCollection
      );
    });

    it('should get worker images list', async () => {
      const { Items } = await workerImagesEntity.query(
        `${identification}#${workerImage.identification}`,
        {
          beginsWith: `${faceId}`,
        }
      );
      expect(Number(Items?.length) >= 1).toBe(true);
    });
  });

  describe('workerTimeline', () => {
    beforeAll(async () => {
      await workerTimelineEntity.put(workerTimeline[0]);
      await workerTimelineEntity.put(workerTimeline[1]);
    });
    afterAll(async () => {
      await workerTimelineEntity.delete({
        identification: workerTimeline[0].identification,
        dateRegister: workerTimeline[0].dateRegister,
      });
      await workerTimelineEntity.delete({
        identification: workerTimeline[1].identification,
        dateRegister: workerTimeline[1].dateRegister,
      });
    });
    it('should get list worker for month', async () => {
      const { Items } = await workerTimelineEntity.query(
        buildPKWorkerTimelineWithDateRegister(
          workerTimeline[0].identification,
          new Date().toISOString()
        )
      );

      expect(Items?.length).toEqual(2);
    });

    it('should get list worker with limit 1', async () => {
      const { Items } = await workerTimelineEntity.query(
        buildPKWorkerTimelineWithDateRegister(
          workerTimeline[0].identification,
          new Date().toISOString()
        ),
        { limit: 1, reverse: true }
      );

      expect(Items?.length).toEqual(1);
      expect(Items?.[0].type).toEqual('out');
    });
  });
  describe('payment test', () => {
    it('create payment template', async () => {
      await paymentEntity.put(paymentEntityMock);
    });
  });
});
