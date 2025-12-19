from fastapi import APIRouter, HTTPException,Depends,UploadFile, File, Form# from app.crud.remark_crud import add_remark, get_remarks_for_task, delete_remark
from app.models.models import RemarkReqRes
from typing import List, Optional
from app.core.security import get_current_user
# from app.crud.remark_crud import add_remark, get_remarks_by_task, delete_remark_by_id, update_remark

from fastapi import APIRouter, HTTPException
from fastapi import APIRouter, UploadFile, File, Header, Form
from app.crud.remarks_crud import add_remark, get_remarks_by_task, delete_remark_by_id
from app.crud.remarks_crud import update_remark
from app.database.mongodb_connection import remarks_collection
from bson import ObjectId
from app.utils.mongo_serializer import serialize_mongo
from app.database.mysql_connection import get_connection
from app.schemas.schemas import TaskSchema

remark_router = APIRouter(prefix="/Remark", tags=["Remark"])
 
@remark_router.get("/getbytask", response_model=List[RemarkReqRes])
def list_for_task(task_id: int, role: str, user=Depends(get_current_user)):
    remarks = get_remarks_by_task(task_id)
    if not remarks:
        raise HTTPException(status_code=404, detail="No remarks found for task")
    return remarks



@remark_router.post("/create")
def create_remark(
    task_id: int = Form(...),
    comment: str = Form(...),
    file: Optional[UploadFile] = File(None),
    role: str = Form(...),
    user=Depends(get_current_user),
):
    r = add_remark(task_id=task_id, comment=comment, e_id=getattr(user, "e_id", None), file=file, role=role, user=user)
    return {"detail": "Remark Added Successfully", "remark": r}


@remark_router.put("/update")
def update_remark_api(
    remark_id: str = Form(...),
    comment: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    role: str = Form(...),
    user=Depends(get_current_user),
):
    updated = update_remark(remark_id=remark_id, comment=comment, file=file, e_id=getattr(user, "e_id", None), role=role)
    return {"detail": "Remark Updated Successfully", "remark": updated}


@remark_router.delete("/delete")
def delete_remark_by_id_api(id: str, role: str, user=Depends(get_current_user)):
    resp = delete_remark_by_id(id, role, user)
    return resp

 


@remark_router.put("/{remark_id}")
def update_remark_api(
    remark_id: str,
    comment: str = Form(None),
    file: UploadFile = File(None),
    x_user_id: int = Header(...),
    x_role: str = Header(...)
):
    return update_remark(
        remark_id=remark_id,
        comment=comment,
        file=file,
        e_id=x_user_id,
        role=x_role
    )



@remark_router.get("/notifications")
def get_notifications(user=Depends(get_current_user)):
    """Return recent remarks for tasks where the current user is reviewer or assigned_by.

    Excludes remarks created by the current user.
    """
    try:
        # find tasks where user is reviewer or assigned_by
        session = get_connection()
        # Only notify users who assigned the task
        tasks = session.query(TaskSchema).filter(
            TaskSchema.assigned_by == getattr(user, "e_id", None)
        ).all()
        task_ids = [t.t_id for t in tasks]
        if not task_ids:
            return []

        docs = list(remarks_collection.find({"task_id": {"$in": task_ids}, "created_by": {"$ne": getattr(user, "e_id", None)}}).sort("created_at", -1).limit(50))

        # fetch tasks to attach title into notification payload
        tasks_map = {t.t_id: t.title for t in tasks}
        out = []
        for d in docs:
            s = serialize_mongo(d)
            # include task title for display
            s["task_title"] = tasks_map.get(s.get("task_id"), None)
            out.append(s)
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            session.close()
        except Exception:
            pass


@remark_router.post("/notifications/markread")
def mark_notification_read(remark_id: str = Form(...), user=Depends(get_current_user)):
    """Mark a remark as read by adding current user's e_id to read_by array."""
    try:
        uid = getattr(user, "e_id", None)
        if not uid:
            raise HTTPException(status_code=400, detail="User id missing")
        remarks_collection.update_one({"_id": ObjectId(remark_id)}, {"$addToSet": {"read_by": uid}})
        return {"detail": "Marked read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @remark_router.get("/getbytask", response_model=List[RemarkReqRes])
# def list_for_task(task_id: int):
#     try:
#         remarks = get_remarks_for_task(task_id)
#         if not remarks:
#             raise HTTPException(status_code=404, detail="No remarks found for task")
#         return remarks
#     except HTTPException as e:
#         raise e
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


# @remark_router.post("/create")
# def create_remark(new_remark: RemarkReqRes):
#     try:
#         r = add_remark(new_remark)
#         return {"detail": "Remark Added Successfully", "remark": r}
#     except HTTPException as e:
#         raise e
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


# @remark_router.delete("/delete")
# def delete_remark_by_id(id: str):
#     try:
#         resp = delete_remark(id)
#         return resp
#     except HTTPException as e:
#         raise e
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")