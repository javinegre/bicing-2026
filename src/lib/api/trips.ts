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

interface TripListResponse {
  success: true;
  trips: Trip[];
}

export async function listTrips(): Promise<Trip[]> {
  const res = await apiFetch<TripListResponse>('/config/trips');
  return res.trips;
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const res = await apiFetch<TripResponse>('/config/trips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.trip;
}

export async function updateTrip(tripId: string, input: TripInput): Promise<Trip> {
  const res = await apiFetch<TripResponse>(`/config/trips/${encodeURIComponent(tripId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.trip;
}

export async function deleteTrip(tripId: string): Promise<void> {
  await apiFetch<{ success: true }>(`/config/trips/${encodeURIComponent(tripId)}`, {
    method: 'DELETE',
  });
}
