from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.geo import Point, StraightLineRouting, haversine_km, project_on_polyline
from app.main import app
from app.matching import match
from app.schemas import MatchRequest

VN = timezone(timedelta(hours=7))
HANOI = {"lat": 21.0285, "lng": 105.8542}
HAI_DUONG = {"lat": 20.9373, "lng": 106.3146}
HAI_PHONG = {"lat": 20.8566, "lng": 106.6829}
VUNG_TAU = {"lat": 10.346, "lng": 107.0843}
DEPART = datetime(2030, 1, 1, 8, 0, tzinfo=VN)


def candidate(trip_id: str, origin=HANOI, dest=HAI_PHONG, depart=DEPART, seats=4):
    return {
        "trip_id": trip_id,
        "origin": origin,
        "destination": dest,
        "departure_time": depart.isoformat(),
        "available_seats": seats,
        "price_per_seat": 200_000,
    }


def request(candidates, pickup=HANOI, dropoff=HAI_PHONG, seats=1, desired=DEPART):
    return MatchRequest.model_validate(
        {
            "request": {
                "pickup": pickup,
                "dropoff": dropoff,
                "seats": seats,
                "desired_departure": desired.isoformat() if desired else None,
                "time_window_minutes": 180,
                "max_pickup_distance_km": 15,
                "max_dropoff_distance_km": 15,
            },
            "candidates": candidates,
            "limit": 20,
        }
    )


routing = StraightLineRouting()


def test_haversine_hanoi_haiphong():
    d = haversine_km(Point(**HANOI), Point(**HAI_PHONG))
    assert 85 < d < 95


def test_projection_fraction():
    line = [Point(**HANOI), Point(**HAI_PHONG)]
    proj = project_on_polyline(Point(**HAI_DUONG), line)
    assert proj.distance_km < 5
    assert 0.4 < proj.fraction < 0.7


def test_exact_route_matches_with_high_score():
    [s] = match(request([candidate("t1")]), routing)
    assert s.trip_id == "t1"
    assert s.score > 95
    assert s.detour_km == 0


def test_passenger_along_the_route_is_matched():
    [s] = match(request([candidate("t1")], pickup=HAI_DUONG), routing)
    assert s.pickup_distance_km < 5


def test_opposite_direction_is_rejected():
    assert match(request([candidate("t1")], pickup=HAI_PHONG, dropoff=HANOI), routing) == []


def test_far_away_route_is_rejected():
    assert match(request([candidate("t1")], dropoff=VUNG_TAU), routing) == []


def test_not_enough_seats_is_rejected():
    assert match(request([candidate("t1", seats=1)], seats=2), routing) == []


def test_outside_time_window_is_rejected():
    late = candidate("t1", depart=DEPART + timedelta(hours=5))
    assert match(request([late]), routing) == []


def test_ranking_prefers_closer_time():
    near = candidate("near", depart=DEPART + timedelta(minutes=15))
    far = candidate("far", depart=DEPART + timedelta(minutes=150))
    result = match(request([far, near]), routing)
    assert [s.trip_id for s in result] == ["near", "far"]


def test_http_endpoint():
    client = TestClient(app)
    assert client.get("/health").json()["status"] == "ok"
    body = request([candidate("t1")]).model_dump(mode="json")
    res = client.post("/v1/match", json=body)
    assert res.status_code == 200
    data = res.json()
    assert data["routing_provider"] == "mock-straight-line"
    assert data["suggestions"][0]["trip_id"] == "t1"
