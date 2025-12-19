from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId
from app.database.mongodb_connection import fs
from app.core.security import get_current_user

file_router = APIRouter(prefix="/file", tags=["Files"])


@file_router.get("/{file_id}")
def get_file(file_id: str, user=Depends(get_current_user)):
    try:
        oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file id")

    try:
        grid_out = fs.get(oid)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

    return StreamingResponse(grid_out, media_type=grid_out.content_type)