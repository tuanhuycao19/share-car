/** Hợp đồng HTTP với services/engine (snake_case theo quy ước Python). */
export interface EnginePoint {
  lat: number;
  lng: number;
}

export interface EngineMatchRequest {
  request: {
    pickup: EnginePoint;
    dropoff: EnginePoint;
    seats: number;
    desired_departure: string | null;
    time_window_minutes: number;
    max_pickup_distance_km: number;
    max_dropoff_distance_km: number;
  };
  candidates: Array<{
    trip_id: string;
    origin: EnginePoint;
    destination: EnginePoint;
    departure_time: string;
    available_seats: number;
    price_per_seat: number;
  }>;
  limit: number;
}

export interface EngineSuggestion {
  trip_id: string;
  score: number;
  pickup_distance_km: number;
  dropoff_distance_km: number;
  detour_km: number;
  time_diff_minutes: number | null;
  reasons: string[];
}

export interface EngineMatchResponse {
  suggestions: EngineSuggestion[];
  engine_version: string;
  routing_provider: string;
}
