import os
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


def delete_attachment_by_id(attachment_id: int, user=None):
    """Delete an attachment record and its file from disk.

    Only ADMIN or the creator of the attachment can delete.
    """
    session = None
    try:
        session = get_connection()
        att = session.query(AttachmentSchema).filter(AttachmentSchema.id == attachment_id).first()
        if not att:
            raise HTTPException(status_code=404, detail="Attachment not found")

        # permission: owner or admin
        if getattr(user, "e_id", None) != att.created_by and not (hasattr(user, "roles") and "Admin" in user.roles):
            raise HTTPException(status_code=403, detail="Not allowed to delete this attachment")

        # delete physical file if exists
        try:
            if att.filepath and os.path.exists(att.filepath):
                os.remove(att.filepath)
        except Exception:
            # ignore file deletion failures
            pass

        session.delete(att)
        session.commit()
        return {"detail": "Attachment deleted", "id": attachment_id}
    except SQLAlchemyError as e:
        if session:
            session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if session:
            session.close()


def delete_attachments_by_task_and_creator(task_id: int, creator_id: int):
    """Remove existing attachments for a task created by the same user.

    Returns list of deleted ids.
    """
    session = None
    deleted_ids = []
    try:
        session = get_connection()
        rows = session.query(AttachmentSchema).filter(
            AttachmentSchema.task_id == task_id,
            AttachmentSchema.created_by == creator_id,
        ).all()
        for r in rows:
            try:
                if r.filepath and os.path.exists(r.filepath):
                    os.remove(r.filepath)
            except Exception:
                pass
            deleted_ids.append(r.id)
            session.delete(r)
        session.commit()
        return deleted_ids
    except SQLAlchemyError as e:
        if session:
            session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if session:
            session.close()
