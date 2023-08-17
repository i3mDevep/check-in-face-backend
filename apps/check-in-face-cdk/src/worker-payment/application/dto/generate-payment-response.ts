import { GeneratePaymentWorkerResponse } from '../../domain/dto/generate-payment-worker-response';

export const generatePaymentResponseDto = (
  data: GeneratePaymentWorkerResponse
): (GeneratePaymentWorkerResponse[''] & { day: string })[] => {
  return Object.entries(data).map(([key, value]) => {
    const [day] = key.split('/');
    return { ...value, day };
  });
};
