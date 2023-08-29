import { GeneratePaymentWorkerResponse } from '../../domain/dto/generate-payment-worker-response';

export interface GenerateResponseDto {
  details: (GeneratePaymentWorkerResponse['detail'][''] & { day: string })[];
  payment: GeneratePaymentWorkerResponse['payment'];
}

export const generatePaymentResponseDto = (
  data: GeneratePaymentWorkerResponse
): GenerateResponseDto => {
  const detailArray = Object.entries(data.detail).map(([key, value]) => {
    const [day] = key.split('/');
    return { ...value, day };
  });

  return { details: detailArray, payment: data.payment };
};
