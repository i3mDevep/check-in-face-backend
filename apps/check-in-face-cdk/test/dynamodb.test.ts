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
  scheduleWeek: ['Monday 1 Hours', 'Saturday 3 Hours'],
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

  describe('work time mock example by calculate payment', () => {
    it('inject date', async () => {
      const identificationMock = '12345678';
      const reason = 'test sapo perro';
      const picture = '';

      const buildItem = (props: {
        dateRegister: Date;
        type: workerTracerTimeType;
      }) => {
        // props.dateRegister.setHours(props.dateRegister.getHours() - 5);

        return {
          dateRegister: props.dateRegister.toISOString(),
          type: props.type,
          identification: identificationMock,
          reason,
          picture,
        };
      };

      const dataMocksTimes: {
        dateRegister: string;
        identification: string;
        reason: string;
        picture: string;
        type: workerTracerTimeType;
      }[] = [
        // one day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 20, 4, 30),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 20, 14, 4),
            type: workerTracerTimeType.OUT,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 20, 14, 24),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 20, 19, 5),
            type: workerTracerTimeType.OUT,
          }),
        },
        // second day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 21, 7, 0),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 21, 17, 20),
            type: workerTracerTimeType.OUT,
          }),
        },
        // three day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 22, 6, 40),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 22, 19, 30),
            type: workerTracerTimeType.OUT,
          }),
        },
        // four day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 23, 2, 50),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 23, 12, 30),
            type: workerTracerTimeType.OUT,
          }),
        },
        // five day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 24, 7, 0),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 24, 18, 27),
            type: workerTracerTimeType.OUT,
          }),
        },
      ];

      await Promise.all(
        dataMocksTimes.map((item) => workerTimelineEntity.put(item))
      );

      // await Promise.all(
      //   dataMocksTimes.map((item) => workerTimelineEntity.delete(item))
      // );
    });

    //Natalia day 2

    it('inject date 2', async () => {
      const identificationMock = '12323222';
      const reason = 'test sapo perro 2';
      const picture = '';

      const buildItem = (props: {
        dateRegister: Date;
        type: workerTracerTimeType;
      }) => {
        // props.dateRegister.setHours(props.dateRegister.getHours() - 5);

        return {
          dateRegister: props.dateRegister.toISOString(),
          type: props.type,
          identification: identificationMock,
          reason,
          picture,
        };
      };

      const dataMocksTimes: {
        dateRegister: string;
        identification: string;
        reason: string;
        picture: string;
        type: workerTracerTimeType;
      }[] = [
        // one day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 20, 4, 30),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 20, 19, 18),
            type: workerTracerTimeType.OUT,
          }),
        },
        // second day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 21, 7, 0),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 21, 16, 0),
            type: workerTracerTimeType.OUT,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 21, 16, 10),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 21, 18, 42),
            type: workerTracerTimeType.OUT,
          }),
        },
        // three day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 22, 5, 30),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 22, 13, 53),
            type: workerTracerTimeType.OUT,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 22, 14, 12),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 22, 19, 54),
            type: workerTracerTimeType.OUT,
          }),
        },
        // four day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 23, 7, 45),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 23, 18, 30),
            type: workerTracerTimeType.OUT,
          }),
        },
        // five day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 24, 2, 50),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 24, 13, 6),
            type: workerTracerTimeType.OUT,
          }),
        },
        // six day
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 25, 7, 56),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 25, 14, 10),
            type: workerTracerTimeType.OUT,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 25, 14, 23),
            type: workerTracerTimeType.IN,
          }),
        },
        {
          ...buildItem({
            dateRegister: new Date(2023, 7, 25, 17, 54),
            type: workerTracerTimeType.OUT,
          }),
        },
      ];

      await Promise.all(
        dataMocksTimes.map((item) => workerTimelineEntity.put(item))
      );

      // await Promise.all(
      //   dataMocksTimes.map((item) => workerTimelineEntity.delete(item))
      // );
    });
  });
});
