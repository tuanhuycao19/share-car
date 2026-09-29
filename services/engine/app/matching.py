"""Thuật toán đề xuất ghép chuyến.

Engine CHỈ đề xuất và xếp hạng. Backend mới là nơi kiểm tra quyền, giá, tồn ghế và lưu booking.

Với mỗi chuyến ứng viên (đã được backend lọc thô bằng PostGIS):
  1. Loại nếu không đủ ghế hoặc lệch giờ quá cửa sổ cho phép.
  2. Chiếu điểm đón / điểm trả lên tuyến đường của chuyến:
     - Loại nếu điểm nào nằm xa tuyến quá ngưỡng.
     - Loại nếu điểm đón nằm SAU điểm trả theo chiều đi (đi ngược chiều).
  3. Ước lượng quãng đường tài xế phải đi vòng thêm (detour).
  4. Chấm điểm 0–100 theo trọng số: khoảng cách đón, khoảng cách trả, độ lệch giờ, detour.
"""

from __future__ import annotations

from dataclasses import dataclass

from .config import settings
from .geo import Point, RoutingProvider, project_on_polyline
from .schemas import MatchRequest, Suggestion, TripCandidate

# Điểm đón phải đứng trước điểm trả ít nhất một chút trên tuyến (tỉ lệ độ dài tuyến)
DIRECTION_TOLERANCE = 0.01
# Detour "chấp nhận được" = max(10 km, 30% chiều dài tuyến)
MIN_DETOUR_BUDGET_KM = 10.0
DETOUR_BUDGET_RATIO = 0.3


@dataclass(frozen=True)
class Weights:
    pickup: float
    dropoff: float
    time: float
    detour: float


def default_weights() -> Weights:
    return Weights(
        pickup=settings.weight_pickup,
        dropoff=settings.weight_dropoff,
        time=settings.weight_time,
        detour=settings.weight_detour,
    )


def _pt(p) -> Point:
    return Point(lat=p.lat, lng=p.lng)


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def evaluate(
    candidate: TripCandidate,
    req: MatchRequest,
    routing: RoutingProvider,
    weights: Weights,
) -> Suggestion | None:
    params = req.request
    if candidate.available_seats < params.seats:
        return None

    time_diff: int | None = None
    time_score = 1.0
    if params.desired_departure is not None:
        delta = candidate.departure_time - params.desired_departure
        time_diff = round(delta.total_seconds() / 60)
        if abs(time_diff) > params.time_window_minutes:
            return None
        time_score = 1 - abs(time_diff) / params.time_window_minutes

    origin, dest = _pt(candidate.origin), _pt(candidate.destination)
    pickup, dropoff = _pt(params.pickup), _pt(params.dropoff)
    route = routing.route(origin, dest)

    p_proj = project_on_polyline(pickup, route)
    d_proj = project_on_polyline(dropoff, route)
    if p_proj.distance_km > params.max_pickup_distance_km:
        return None
    if d_proj.distance_km > params.max_dropoff_distance_km:
        return None
    if p_proj.fraction >= d_proj.fraction - DIRECTION_TOLERANCE:
        return None  # ngược chiều hoặc đón/trả cùng một chỗ trên tuyến

    direct = routing.distance_km(origin, dest)
    with_stops = (
        routing.distance_km(origin, pickup)
        + routing.distance_km(pickup, dropoff)
        + routing.distance_km(dropoff, dest)
    )
    detour = max(0.0, with_stops - direct)
    detour_budget = max(MIN_DETOUR_BUDGET_KM, DETOUR_BUDGET_RATIO * direct)

    score = 100 * (
        weights.pickup * _clamp01(1 - p_proj.distance_km / params.max_pickup_distance_km)
        + weights.dropoff * _clamp01(1 - d_proj.distance_km / params.max_dropoff_distance_km)
        + weights.time * _clamp01(time_score)
        + weights.detour * _clamp01(1 - detour / detour_budget)
    )

    reasons = [
        f"Điểm đón cách tuyến {p_proj.distance_km:.1f} km",
        f"Điểm trả cách tuyến {d_proj.distance_km:.1f} km",
    ]
    if time_diff is not None:
        if time_diff == 0:
            reasons.append("Khởi hành đúng giờ mong muốn")
        elif time_diff > 0:
            reasons.append(f"Khởi hành muộn hơn {time_diff} phút so với giờ mong muốn")
        else:
            reasons.append(f"Khởi hành sớm hơn {-time_diff} phút so với giờ mong muốn")
    if detour >= 1:
        reasons.append(f"Tài xế đi vòng thêm khoảng {detour:.1f} km")
    reasons.append(f"Còn {candidate.available_seats} ghế trống")

    return Suggestion(
        trip_id=candidate.trip_id,
        score=round(score, 1),
        pickup_distance_km=round(p_proj.distance_km, 1),
        dropoff_distance_km=round(d_proj.distance_km, 1),
        detour_km=round(detour, 1),
        time_diff_minutes=time_diff,
        reasons=reasons,
    )


def match(
    req: MatchRequest, routing: RoutingProvider, weights: Weights | None = None
) -> list[Suggestion]:
    w = weights or default_weights()
    by_id = {c.trip_id: c for c in req.candidates}
    results = [s for c in req.candidates if (s := evaluate(c, req, routing, w)) is not None]
    results.sort(key=lambda s: (-s.score, by_id[s.trip_id].departure_time))
    return results[: req.limit]
