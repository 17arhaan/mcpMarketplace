from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from api.db import get_db
from api.dependencies import get_current_user
from api.models.rating import Rating
from api.models.tool import Tool
from api.models.user import User
from api.schemas.ratings import RatingListResponse, RatingOut, RatingRequest

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("", response_model=RatingOut, status_code=201)
def rate_tool(body: RatingRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.id == body.tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    rating = Rating(user_id=user.id, tool_id=body.tool_id, score=body.score, review=body.review)
    db.add(rating)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already rated this tool")

    # Recompute avg_rating
    avg = db.query(func.avg(Rating.score)).filter(Rating.tool_id == body.tool_id).scalar()
    tool.avg_rating = float(avg) if avg else None
    db.commit()
    db.refresh(rating)
    return rating


@router.get("/{tool_id}", response_model=RatingListResponse)
def get_ratings(
    tool_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Rating).filter(Rating.tool_id == tool_id)
    total = query.count()
    ratings = query.order_by(Rating.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return RatingListResponse(ratings=ratings, total=total, page=page, limit=limit)
