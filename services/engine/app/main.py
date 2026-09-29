from fastapi import FastAPI

from . import __version__
from .geo import StraightLineRouting
from .matching import match
from .schemas import MatchRequest, MatchResponse

app = FastAPI(
    title="Share Car Matching Engine",
    version=__version__,
    description=(
        "Đề xuất chuyến phù hợp cho hành khách theo tuyến đường, thời gian và số ghế. "
        "Engine không lưu trạng thái và không tạo booking."
    ),
)

# ⚠️ MOCK routing — thay bằng provider thật khi tích hợp bản đồ (xem app/geo.py)
routing = StraightLineRouting()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": __version__, "routing_provider": routing.name}


@app.post("/v1/match", response_model=MatchResponse)
def match_trips(body: MatchRequest) -> MatchResponse:
    return MatchResponse(
        suggestions=match(body, routing),
        engine_version=__version__,
        routing_provider=routing.name,
    )
