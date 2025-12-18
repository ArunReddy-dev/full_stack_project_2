from app.database.mysql_connection import get_connection
from app.schemas.schemas import AttachmentSchema
from app.models.models import TaskReqRes
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
from datetime import datetime


def add_attachment(task_id: int, filename: str, filepath: str, remark: str, user):
    session = None
    try:
        session = get_connection()
        att = AttachmentSchema(
            task_id=task_id,
            filename=filename,
            filepath=filepath,
            remark=remark,
            created_by=user.e_id,
            created_at=datetime.now(),
        )
        session.add(att)
        session.commit()
        session.refresh(att)
        return {
            "id": att.id,
            "task_id": att.task_id,
            "filename": att.filename,
            "filepath": att.filepath,
            "remark": att.remark,
            "created_by": att.created_by,
            "created_at": att.created_at.isoformat(),
        }
    except SQLAlchemyError as e:
        if session:
            session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if session:
            session.close()


def get_attachments(task_id: int):
    session = None
    try:
        session = get_connection()
        rows = session.query(AttachmentSchema).filter(AttachmentSchema.task_id == task_id).all()
        return [
            {
                "id": r.id,
                "task_id": r.task_id,
                "filename": r.filename,
                "filepath": r.filepath,
                "remark": r.remark,
                "created_by": r.created_by,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if session:
            session.close()
