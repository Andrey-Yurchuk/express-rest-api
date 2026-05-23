import { HttpError } from '../errors/http-error';

const POSITIVE_INTEGER = /^\d+$/;

const FALLBACK_DEFAULT_PAGE = 1;
const FALLBACK_DEFAULT_LIST_SIZE = 10;

export function parsePositiveInt(value: unknown, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value !== 'string' || !POSITIVE_INTEGER.test(value)) {
    throw new HttpError(400, 'Pagination parameter must be a positive integer');
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, 'Pagination parameter must be greater than zero');
  }
  return parsed;
}

export function getDefaultPage(): number {
  return readPositiveIntEnv(process.env.PAGINATION_DEFAULT_PAGE, FALLBACK_DEFAULT_PAGE);
}

export function getDefaultListSize(): number {
  return readPositiveIntEnv(process.env.PAGINATION_DEFAULT_LIST_SIZE, FALLBACK_DEFAULT_LIST_SIZE);
}

function readPositiveIntEnv(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
