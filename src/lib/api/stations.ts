import { apiFetch } from './client';
import type { StationInfo, StationStatus } from '$lib/domain/types';

interface ListResponse<T> {
  success: boolean;
  lastUpdated?: number;
  stations?: T[];
  errorMessage?: string;
}

/** Wire shape of `/v2/station-status` — single-letter keys to keep ~500 rows small. */
interface WireStatus {
  i: number;
  e: number;
  m: number;
  d: number;
  s: 0 | 1;
}

function unwrap<T>(res: ListResponse<T>, what: string): { stations: T[]; lastUpdated: number } {
  if (!res.success || !res.stations) {
    throw new Error(res.errorMessage ?? `Bicing API returned no ${what}`);
  }
  return { stations: res.stations, lastUpdated: res.lastUpdated ?? Date.now() / 1000 };
}

export async function fetchStationInfo(): Promise<StationInfo[]> {
  const res = await apiFetch<ListResponse<StationInfo>>('/station-info');
  return unwrap(res, 'station info').stations;
}

export async function fetchStationStatus(): Promise<{
  stations: StationStatus[];
  lastUpdated: number;
}> {
  const res = await apiFetch<ListResponse<WireStatus>>('/station-status');
  const { stations, lastUpdated } = unwrap(res, 'station status');
  return {
    lastUpdated,
    stations: stations.map(({ i, e, m, d, s }) => ({
      id: i,
      electrical: e,
      mechanical: m,
      docks: d,
      status: s,
    })),
  };
}
