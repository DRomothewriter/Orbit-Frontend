import { Pipe, PipeTransform } from '@angular/core';

const SPANISH_DAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

function startOfLocalDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

export function formatChatTimestamp(
  value?: string | Date | null,
  now: Date = new Date()
): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(
    (startOfLocalDay(now) - startOfLocalDay(date)) / msPerDay
  );

  if (diffDays === 0) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  if (diffDays >= 1 && diffDays < 7) {
    return SPANISH_DAYS[date.getDay()];
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

@Pipe({
  name: 'orbitChatTime',
  standalone: true,
})
export class OrbitChatTimePipe implements PipeTransform {
  transform(value?: string | Date | null): string {
    return formatChatTimestamp(value);
  }
}
