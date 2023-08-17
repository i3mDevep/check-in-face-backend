export const calculateHoursNight = (
  pointDynamic: {
    start: number;
    end: number;
  },
  pointReference: {
    start: number;
    end: number;
  }
) => {
  const isAmongPointeReference = (pointX: number) =>
    pointX > pointReference.start && pointX <= pointReference.end;
  const diffPoints = (end: number, start: number) => end - start;
  if (
    isAmongPointeReference(pointDynamic.start) &&
    isAmongPointeReference(pointDynamic.end)
  )
    return diffPoints(pointDynamic.end, pointDynamic.start);
  if (isAmongPointeReference(pointDynamic.end))
    return diffPoints(pointDynamic.end, pointReference.start);
  if (isAmongPointeReference(pointDynamic.start))
    return diffPoints(pointReference.end, pointDynamic.start);
  if (
    pointDynamic.start <= pointReference.start &&
    pointDynamic.end >= pointReference.end
  )
    return diffPoints(pointReference.end, pointReference.start);
  return 0;
};
