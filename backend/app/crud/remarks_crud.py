from bson import ObjectId
from fastapi import HTTPException
from datetime import datetime
from app.database.mongodb_connection import remarks_collection
from app.utils.file_upload import save_file, delete_file
from app.utils.mongo_serializer import serialize_mongo
from datetime import timezone
 
def add_remark(task_id: int, comment: str, e_id: int, file=None):
    file_id = None
    file_name = None
 
    if file:
        file_id = save_file(file)
        file_name = file.filename
 
    remark = {
        "task_id": task_id,
        "comment": comment,
        "e_id": e_id,              # ✅ FIXED (was user_id)
        "file_id": file_id,
        "file_name": file_name,
        "created_at": datetime.now(timezone.utc),
    }
 
    result = remarks_collection.insert_one(remark)
    remark["_id"] = result.inserted_id
 
    return serialize_mongo(remark)
 
 
def get_remarks_by_task(task_id: int):
    remarks = remarks_collection.find({"task_id": task_id})
    return [serialize_mongo(r) for r in remarks]
 
 
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