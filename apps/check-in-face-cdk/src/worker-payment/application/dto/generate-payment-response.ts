import { GeneratePaymentWorkerResponse } from '../../domain/dto/generate-payment-worker-response';

export interface GenerateResponseDto {
  details: (GeneratePaymentWorkerResponse['detail'][''] & { day: string })[];
  payment: GeneratePaymentWorkerResponse['payment'];
}

export const generatePaymentResponseDto = (
  data: GeneratePaymentWorkerResponse
): GenerateResponseDto => {
  const { detail, ...rest } = data;
  const detailArray = Object.entries(detail).map(([key, value]) => {
    const [day] = key.split('/');
    return { ...value, day };
  });
  return { ...rest, details: detailArray };
};
