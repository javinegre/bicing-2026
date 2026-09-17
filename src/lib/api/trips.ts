import { apiFetch } from './client';

export interface Trip {
  id: string;
  origin: number;
  destination: number;
  label: string;
}

/** What a client sends to create a trip; the server assigns the id. */
export type TripInput = Omit<Trip, 'id'>;

interface TripResponse {
  success: true;
  trip: Trip;
  updatedAt: number;
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const res = await apiFetch<TripResponse>('/config/trips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.trip;
}
