"""Hợp đồng HTTP giữa backend (NestJS) và engine. Dùng snake_case."""

from datetime import datetime

from pydantic import BaseModel, Field


class GeoPoint(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class MatchRequestParams(BaseModel):
    pickup: GeoPoint
    dropoff: GeoPoint
    seats: int = Field(ge=1, le=6)
    desired_departure: datetime | None = None
    time_window_minutes: int = Field(default=180, ge=1, le=24 * 60)
    max_pickup_distance_km: float = Field(default=15, gt=0)
    max_dropoff_distance_km: float = Field(default=15, gt=0)


class TripCandidate(BaseModel):
    trip_id: str
    origin: GeoPoint
    destination: GeoPoint
    departure_time: datetime
    available_seats: int = Field(ge=0)
    price_per_seat: int = Field(ge=0, description="VND")


class MatchRequest(BaseModel):
    request: MatchRequestParams
    candidates: list[TripCandidate] = Field(max_length=1000)
    limit: int = Field(default=20, ge=1, le=200)


class Suggestion(BaseModel):
    trip_id: str
    score: float = Field(description="0–100, cao hơn là phù hợp hơn")
    pickup_distance_km: float
    dropoff_distance_km: float
    detour_km: float
    time_diff_minutes: int | None
    reasons: list[str]


class MatchResponse(BaseModel):
    suggestions: list[Suggestion]
    engine_version: str
    routing_provider: str
