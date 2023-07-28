import {
  workerEntity,
  workerImagesEntity,
  workerTimelineEntity,
  CHECK_IN_FACE_KEYS,
  buildPKWorkerTimelineWithDateRegister,
} from '../src/shared/infrastructure/persistence';

const { identification, worker, faceId } = CHECK_IN_FACE_KEYS;

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

const workerTimeline = {
  dateRegister: new Date().toISOString(),
  identification: 'identification_mock_fake',
  reason: 'LAUNCH',
  picture: '/time-line/0191',
};
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
      await workerTimelineEntity.put(workerTimeline);
    });
    afterAll(async () => {
      await workerTimelineEntity.delete({
        identification: workerTimeline.identification,
        dateRegister: workerTimeline.dateRegister,
      });
    });
    it('should get list worker for month', async () => {
      const { Items } = await workerImagesEntity.query(
        buildPKWorkerTimelineWithDateRegister(
          workerTimeline.identification,
          new Date().toISOString()
        )
      );

      expect(Items?.length).toEqual(1);
    });
  });
});
