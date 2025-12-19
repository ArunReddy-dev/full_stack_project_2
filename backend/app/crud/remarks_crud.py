from bson import ObjectId
from fastapi import HTTPException
from datetime import datetime, timezone
from app.database.mysql_connection import get_connection
from app.database.mongodb_connection import remarks_collection
from sqlalchemy.orm import Session
from app.schemas.schemas import TaskSchema
from app.utils.file_upload import save_file, delete_file
from app.utils.mongo_serializer import serialize_mongo
 
def _is_manager(user) -> bool:
    return hasattr(user, "role") and ("Manager" in user.role if isinstance(user.role, list) else "Manager" in str(user.role))


def _is_developer(user) -> bool:
    return hasattr(user, "role") and ("Developer" in user.role if isinstance(user.role, list) else "Developer" in str(user.role))


def add_remark(task_id: int, comment: str, e_id: int, file=None, role: str = None, user=None):
    """Add a remark for a task. Allow any role/phase to create a remark (development/dev requirement).

    The function will persist the optional file to GridFS and store both `created_by` and `e_id`
    fields so downstream code that expects either name will work.
    """
    session: Session = get_connection()
    try:
        task = session.query(TaskSchema).filter(TaskSchema.t_id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # Allow any role and any task phase to create remarks. This simplifies client workflows
        # and delegates fine-grained permission checks to higher-level business logic when needed.

        # Handle file upload (optional)
        file_id = None
        file_name = None
        if file:
            file_id = save_file(file)
            file_name = file.filename

        remark = {
            "task_id": task_id,
            "comment": comment,
            # store both keys for compatibility with existing checks elsewhere in the repo
            "created_by": e_id,
            "e_id": e_id,
            "role": role,
            "file_id": file_id,
            "file_name": file_name,
            "created_at": datetime.now(timezone.utc),
        }
        result = remarks_collection.insert_one(remark)
        remark["_id"] = result.inserted_id
        return serialize_mongo(remark)
    except HTTPException:
        raise
    except Exception as e:
        # wrap unexpected errors
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()
 
 
def get_remarks_by_task(task_id: int):
    docs = list(remarks_collection.find({"task_id": task_id}))
    return [serialize_mongo(d) for d in docs]


def update_remark(remark_id: str, comment: str | None, file, e_id: int, role: str):
    remark = remarks_collection.find_one({"_id": ObjectId(remark_id)})
    if not remark:
        raise HTTPException(status_code=404, detail="Remark not found")

    # Only admin or owner can update
    if not (role and role.upper() == "ADMIN") and remark.get("created_by") != e_id:
        raise HTTPException(status_code=403, detail="Not allowed to update this remark")

    update_data = {}
    if comment:
        update_data["comment"] = comment

    if file:
        if remark.get("file_id"):
            try:
                delete_file(remark["file_id"])
            except Exception:
                pass

        file_id = save_file(file)
        update_data["file_id"] = file_id
        update_data["file_name"] = file.filename

    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update")

    update_data["updated_at"] = datetime.now(timezone.utc)
    remarks_collection.update_one({"_id": ObjectId(remark_id)}, {"$set": update_data})
    updated = remarks_collection.find_one({"_id": ObjectId(remark_id)})
    return serialize_mongo(updated)


def delete_remark_by_id(remark_id: str, role: str, user):
    remark = remarks_collection.find_one({"_id": ObjectId(remark_id)})
    if not remark:
        raise HTTPException(status_code=404, detail="Remark not found")

    # Only ADMIN or owner can delete
    if not (role and role.upper() == "ADMIN") and remark.get("created_by") != getattr(user, "e_id", None):
        raise HTTPException(status_code=403, detail="Not allowed to delete this remark")

    if remark.get("file_id"):
        try:
            delete_file(str(remark["file_id"]))
        except Exception:
            pass

    remarks_collection.delete_one({"_id": ObjectId(remark_id)})
    return {"message": "Remark and file deleted successfully", "remark_id": remark_id}
 
 
def update_remark(
    remark_id: str,
    comment: str | None,
    file,
    e_id: int,
    role: str
):
    remark = remarks_collection.find_one({"_id": ObjectId(remark_id)})
 
    if not remark:
        raise HTTPException(status_code=404, detail="Remark not found")
 
    # 🔐 ownership check
    if role != "ADMIN" and remark["e_id"] != e_id:
        raise HTTPException(status_code=403, detail="Not allowed to update this remark")
 
    update_data = {}
 
    if comment:
        update_data["comment"] = comment
 
    # 📎 replace file if uploaded
    if file:
        if remark.get("file_id"):
            delete_file(remark["file_id"])
 
        file_id = save_file(file)
        update_data["file_id"] = file_id
        update_data["file_name"] = file.filename
 
    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update")
 
    update_data["updated_at"] = datetime.now(timezone.utc)
 
    remarks_collection.update_one(
        {"_id": ObjectId(remark_id)},
        {"$set": update_data}
    )
 
    updated = remarks_collection.find_one({"_id": ObjectId(remark_id)})
    return serialize_mongo(updated)
 
 
def delete_remark_by_id(remark_id: str):
    remark = remarks_collection.find_one({"_id": ObjectId(remark_id)})
 
    if not remark:
        raise Exception("Remark not found")
 
    # delete attached file if exists
    if remark.get("file_id"):
        delete_file(str(remark["file_id"]))
 
    remarks_collection.delete_one({"_id": ObjectId(remark_id)})
 
    return {
        "message": "Remark and file deleted successfully",
        "remark_id": remark_id
    }