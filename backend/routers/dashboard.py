"""
LandSetu Backend — Dashboard Router

Provides high-level platform governance metrics and recent activity stream.
"""

from fastapi import APIRouter
from typing import List
from config import DISCLAIMER
from models import DashboardSummaryResponse, ActivityItem, DashboardSummaryMetrics
from services.dashboard_service import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["Governance Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get aggregated platform metrics and recent activity for Dashboard",
)
async def get_summary():
    """
    Retrieve live governance metrics (parcels, requests, alerts, audit events)
    and the recent platform activity stream.
    """
    data = get_dashboard_summary()
    return DashboardSummaryResponse(
        metrics=DashboardSummaryMetrics(**data["metrics"]),
        recent_activity=[ActivityItem(**item) for item in data["recent_activity"]],
        disclaimer=DISCLAIMER,
    )


@router.get(
    "/recent-activity",
    response_model=List[ActivityItem],
    summary="Get recent activity items",
)
async def get_recent_activity():
    """Retrieve the recent platform activity stream."""
    data = get_dashboard_summary()
    return [ActivityItem(**item) for item in data["recent_activity"]]
