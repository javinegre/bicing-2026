export interface Coordinates {
  lat: number;
  lng: number;
}

/** Station identity and position — from `/v2/station-info`, cached 10 min upstream. */
export interface StationInfo {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

/** Live counts — from `/v2/station-status`, cached 60 s upstream. */
export interface StationStatus {
  id: number;
  mechanical: number;
  electrical: number;
  docks: number;
  /** 0 = inactive (closed / no data), 1 = in service. */
  status: 0 | 1;
}

export type Station = StationInfo & StationStatus;

/** Which resource the map is colouring markers by. */
export type ResourceType = 'bikes' | 'docks';

/** Optional narrowing of "bikes" to one drivetrain. */
export type BikeTypeFilter = 'mechanical' | 'electrical' | null;

/** The five marker/dot states, worst to best. `gray` means out of service. */
export type StateColor = 'gray' | 'black' | 'red' | 'orange' | 'green';

export type MarkerSize = 'big' | 'small';

export type BookmarkType = 'home' | 'work' | 'favorite';
