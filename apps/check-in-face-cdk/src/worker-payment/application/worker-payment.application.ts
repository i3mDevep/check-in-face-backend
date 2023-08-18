import { CreateTemplatePaymentRepository } from '../domain/create-template-payment.repository';
import { GetTemplatePaymentRepository } from '../domain/get-template-payment.repository';
import { WorkerPaymentEntity } from '../domain/worker-payment.entity';
import { getWorkerTimeAndGroupByDay } from '../../worker-time/domain/services/get-worker-time-and-group-by-day';
import { WorkerTimeIntervalRepository } from '../../worker-time/domain/worker-time-interval.repository';
import { calculateIntervalTime } from '../../worker-time/domain/services/calculate-intervals-time';
import {
  IntervalsTypes,
  ParamsIntervalTime,
} from '../../worker-time/domain/dto/intervals-time.dto';
import { calculatePaymentWorker } from '../domain/services/calculate-payment-worker';
import {
  ErrorIntervalDate,
  ErrorPaymentUndefine,
} from '../domain/worker-payment.error';
import { generatePaymentResponseDto } from './dto/generate-payment-response';

export const workerPaymentApplications = (
  repositoryPayment: GetTemplatePaymentRepository &
    CreateTemplatePaymentRepository,
  repositoryWorkerTimeInterval: WorkerTimeIntervalRepository
) => {
  return {
    get: () => repositoryPayment.get(),
    create: (props: WorkerPaymentEntity) => repositoryPayment.create(props),
    generatePaymentWorker: async (params: ParamsIntervalTime) => {
      const { end, start } = params;

      if (new Date(end).getMonth() !== new Date(start).getMonth())
        throw new ErrorIntervalDate();

      const paymentTemplate = await repositoryPayment.get();

      if (!paymentTemplate) throw new ErrorPaymentUndefine();

      const workerRegistersGroup = await getWorkerTimeAndGroupByDay(
        repositoryWorkerTimeInterval
      )(params);

      const intervalRegisterGroupByDay = Array.from(
        workerRegistersGroup
      ).reduce((prev, curr) => {
        const [key, value] = curr;
        prev.set(key, calculateIntervalTime(value));
        return prev;
      }, new Map<string, IntervalsTypes[]>());

      return generatePaymentResponseDto(
        calculatePaymentWorker(intervalRegisterGroupByDay, paymentTemplate)
      );
    },
  };
};
