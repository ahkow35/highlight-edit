"""Analytics API endpoints (admin only)."""

from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, distinct

from app.db.database import get_db
from app.api.deps import get_current_admin_user
from app.models.sql import User, UsageEvent

router = APIRouter()


@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """High-level dashboard stats."""
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_ago = today_start - timedelta(days=7)
    month_ago = today_start - timedelta(days=30)

    total_users = db.query(func.count(User.id)).scalar() or 0

    # Active users = users with at least one event in the period
    active_today = (
        db.query(func.count(distinct(UsageEvent.user_id)))
        .filter(UsageEvent.created_at >= today_start, UsageEvent.user_id.isnot(None))
        .scalar() or 0
    )
    active_week = (
        db.query(func.count(distinct(UsageEvent.user_id)))
        .filter(UsageEvent.created_at >= week_ago, UsageEvent.user_id.isnot(None))
        .scalar() or 0
    )
    active_month = (
        db.query(func.count(distinct(UsageEvent.user_id)))
        .filter(UsageEvent.created_at >= month_ago, UsageEvent.user_id.isnot(None))
        .scalar() or 0
    )

    total_events_today = (
        db.query(func.count(UsageEvent.id))
        .filter(UsageEvent.created_at >= today_start)
        .scalar() or 0
    )

    total_docs = (
        db.query(func.count(UsageEvent.id))
        .filter(UsageEvent.event_type.in_(["export_docx", "export_pdf"]))
        .scalar() or 0
    )

    # Plan distribution
    plan_rows = (
        db.query(
            User.is_paid,
            func.count(User.id),
        )
        .group_by(User.is_paid)
        .all()
    )
    plan_distribution = {}
    for is_paid, count in plan_rows:
        key = "pro" if is_paid else "free"
        plan_distribution[key] = count

    signups_week = (
        db.query(func.count(UsageEvent.id))
        .filter(UsageEvent.event_type == "signup", UsageEvent.created_at >= week_ago)
        .scalar() or 0
    )

    return {
        "total_users": total_users,
        "active_users_today": active_today,
        "active_users_this_week": active_week,
        "active_users_this_month": active_month,
        "total_events_today": total_events_today,
        "total_documents_generated": total_docs,
        "plan_distribution": plan_distribution,
        "signups_this_week": signups_week,
    }


@router.get("/events")
def get_events(
    days: int = Query(30, ge=1, le=365),
    event_type: str = Query(None),
    user_id: int = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Daily time-series of event counts, filterable."""
    start_date = datetime.utcnow() - timedelta(days=days)

    query = db.query(
        func.date(UsageEvent.created_at).label("day"),
        UsageEvent.event_type,
        func.count(UsageEvent.id).label("count"),
    ).filter(UsageEvent.created_at >= start_date)

    if event_type:
        types = [t.strip() for t in event_type.split(",")]
        query = query.filter(UsageEvent.event_type.in_(types))
    if user_id:
        query = query.filter(UsageEvent.user_id == user_id)

    query = query.group_by("day", UsageEvent.event_type).order_by("day")
    rows = query.all()

    # Pivot into {date: {event_type: count}} structure
    series_map: dict = {}
    for day, etype, count in rows:
        day_str = str(day)
        if day_str not in series_map:
            series_map[day_str] = {"date": day_str}
        series_map[day_str][etype] = count

    return {"series": list(series_map.values())}


@router.get("/users")
def get_top_users(
    sort: str = Query("events"),
    order: str = Query("desc"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Ranked list of users by activity."""
    # Subquery: event count per user
    event_counts = (
        db.query(
            UsageEvent.user_id,
            func.count(UsageEvent.id).label("total_events"),
            func.max(UsageEvent.created_at).label("last_active"),
            func.count(
                case(
                    (UsageEvent.event_type.in_(["export_docx", "export_pdf"]), 1),
                )
            ).label("documents_generated"),
        )
        .filter(UsageEvent.user_id.isnot(None))
        .group_by(UsageEvent.user_id)
        .subquery()
    )

    query = (
        db.query(
            User.id,
            User.email,
            User.is_paid,
            User.created_at.label("signup_date"),
            func.coalesce(event_counts.c.total_events, 0).label("total_events"),
            event_counts.c.last_active,
            func.coalesce(event_counts.c.documents_generated, 0).label("documents_generated"),
        )
        .outerjoin(event_counts, User.id == event_counts.c.user_id)
    )

    # Sort
    sort_col = func.coalesce(event_counts.c.total_events, 0)
    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    rows = query.limit(limit).all()

    users = []
    for row in rows:
        users.append({
            "id": row.id,
            "email": row.email,
            "plan": "pro" if row.is_paid else "free",
            "total_events": row.total_events,
            "last_active": row.last_active.isoformat() if row.last_active else None,
            "documents_generated": row.documents_generated,
            "signup_date": row.signup_date.isoformat() if row.signup_date else None,
        })

    return {"users": users}


@router.get("/user/{user_id}")
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Detailed stats + recent events for a single user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)

    total_events = db.query(func.count(UsageEvent.id)).filter(UsageEvent.user_id == user_id).scalar() or 0
    events_this_month = (
        db.query(func.count(UsageEvent.id))
        .filter(UsageEvent.user_id == user_id, UsageEvent.created_at >= month_start)
        .scalar() or 0
    )
    docs_generated = (
        db.query(func.count(UsageEvent.id))
        .filter(
            UsageEvent.user_id == user_id,
            UsageEvent.event_type.in_(["export_docx", "export_pdf"]),
        )
        .scalar() or 0
    )
    templates_saved = (
        db.query(func.count(UsageEvent.id))
        .filter(UsageEvent.user_id == user_id, UsageEvent.event_type == "template_save")
        .scalar() or 0
    )
    limit_hits = (
        db.query(func.count(UsageEvent.id))
        .filter(UsageEvent.user_id == user_id, UsageEvent.event_type == "limit_hit")
        .scalar() or 0
    )
    last_event = (
        db.query(func.max(UsageEvent.created_at))
        .filter(UsageEvent.user_id == user_id)
        .scalar()
    )

    # Last 50 events
    recent = (
        db.query(UsageEvent)
        .filter(UsageEvent.user_id == user_id)
        .order_by(UsageEvent.created_at.desc())
        .limit(50)
        .all()
    )

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "plan": "pro" if user.is_paid else "free",
        },
        "stats": {
            "total_events": total_events,
            "events_this_month": events_this_month,
            "documents_generated": docs_generated,
            "templates_saved": templates_saved,
            "limit_hits": limit_hits,
            "last_active": last_event.isoformat() if last_event else None,
        },
        "recent_events": [
            {
                "event_type": e.event_type,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "metadata": e.metadata_json,
            }
            for e in recent
        ],
    }
