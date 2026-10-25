import type { StatsProgressPointResponseDto } from '@sportbot/api/generated/model';

export const bestPerDay = (points: StatsProgressPointResponseDto[]) =>
  points.reduce<StatsProgressPointResponseDto[]>((days, point) => {
    const previous = days.at(-1);
    if (previous?.date.slice(0, 10) !== point.date.slice(0, 10)) days.push(point);
    else if (point.value > previous.value) days[days.length - 1] = point;
    return days;
  }, []);
