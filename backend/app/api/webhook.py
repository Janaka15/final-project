from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.dialogflow_service import route_intent

router = APIRouter(prefix="/api/webhook", tags=["webhook"])


@router.post("/dialogflow")
async def dialogflow_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()

    try:
        query_result = body.get("queryResult", {})
        intent_name = query_result.get("intent", {}).get("displayName", "")
        params = query_result.get("parameters", {})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Dialogflow request format")

    return route_intent(intent_name, params, db)
