"""Hàm hình học & routing provider.

⚠️ MOCK: `StraightLineRouting` coi tuyến đường của chuyến là ĐOẠN THẲNG từ điểm đi tới điểm đến
và khoảng cách đường bộ = đường chim bay × ROAD_FACTOR. Khi tích hợp dịch vụ bản đồ thật
(OSRM / GraphHopper / Google / Goong...), cài đặt một RoutingProvider mới trả về polyline
& khoảng cách thật, phần chấm điểm trong matching.py không cần đổi.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Protocol

EARTH_RADIUS_KM = 6371.0
ROAD_FACTOR = 1.25


@dataclass(frozen=True)
class Point:
    lat: float
    lng: float


def haversine_km(a: Point, b: Point) -> float:
    phi1, phi2 = math.radians(a.lat), math.radians(b.lat)
    dphi = math.radians(b.lat - a.lat)
    dlmb = math.radians(b.lng - a.lng)
    h = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(h))


def _to_xy_km(p: Point, ref_lat: float) -> tuple[float, float]:
    """Chiếu equirectangular quanh vĩ độ tham chiếu — đủ chính xác cho quãng vài trăm km."""
    x = math.radians(p.lng) * EARTH_RADIUS_KM * math.cos(math.radians(ref_lat))
    y = math.radians(p.lat) * EARTH_RADIUS_KM
    return x, y


@dataclass(frozen=True)
class Projection:
    """Vị trí của một điểm so với một polyline."""

    distance_km: float  # khoảng cách vuông góc tới tuyến
    fraction: float  # vị trí dọc tuyến, 0 = điểm đầu, 1 = điểm cuối


def project_on_polyline(p: Point, line: list[Point]) -> Projection:
    if len(line) < 2:
        raise ValueError("Polyline cần ít nhất 2 điểm")
    ref_lat = sum(q.lat for q in line) / len(line)
    px, py = _to_xy_km(p, ref_lat)
    pts = [_to_xy_km(q, ref_lat) for q in line]
    seg_lengths = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    total = sum(seg_lengths) or 1e-9

    best = Projection(distance_km=math.inf, fraction=0.0)
    walked = 0.0
    for (ax, ay), (bx, by), seg in zip(pts, pts[1:], seg_lengths, strict=False):
        dx, dy = bx - ax, by - ay
        t = 0.0 if seg == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (seg * seg)))
        cx, cy = ax + t * dx, ay + t * dy
        d = math.dist((px, py), (cx, cy))
        if d < best.distance_km:
            best = Projection(distance_km=d, fraction=(walked + t * seg) / total)
        walked += seg
    return best


class RoutingProvider(Protocol):
    name: str

    def route(self, origin: Point, destination: Point) -> list[Point]:
        """Trả về polyline của tuyến đường."""
        ...

    def distance_km(self, a: Point, b: Point) -> float:
        """Khoảng cách đường bộ ước lượng."""
        ...


class StraightLineRouting:
    """⚠️ MOCK routing: tuyến = đoạn thẳng, khoảng cách = haversine × ROAD_FACTOR."""

    name = "mock-straight-line"

    def route(self, origin: Point, destination: Point) -> list[Point]:
        return [origin, destination]

    def distance_km(self, a: Point, b: Point) -> float:
        return haversine_km(a, b) * ROAD_FACTOR
