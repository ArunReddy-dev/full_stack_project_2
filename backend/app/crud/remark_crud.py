# from app.database.mongodb_connection import get_mongo_db
# from app.models.models import RemarkReqRes
# from datetime import datetime
# from fastapi import HTTPException
# from bson.objectid import ObjectId


# def add_remark(new_remark: RemarkReqRes):
#     try:
#         db = get_mongo_db()
#         doc = {
#             "task_id": new_remark.task_id,
#             "comment": new_remark.comment,
#             "created_by": new_remark.created_by,
#             "created_at": new_remark.created_at or datetime.utcnow()
#         }
#         res = db.remarks.insert_one(doc)
#         doc["_id"] = str(res.inserted_id)
#         return doc
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"MongoDB error: {str(e)}")


# def get_remarks_for_task(task_id: int):
#     try:
#         db = get_mongo_db()
#         docs = list(db.remarks.find({"task_id": task_id}))
#         for d in docs:
#             d["_id"] = str(d.get("_id"))
#         return docs
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"MongoDB error: {str(e)}")


# def delete_remark(remark_id: str):
#     try:
#         db = get_mongo_db()
#         res = db.remarks.delete_one({"_id": ObjectId(remark_id)})
#         if res.deleted_count == 0:
#             raise HTTPException(status_code=404, detail="Remark not found")
#         return {"detail": "Remark deleted"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"MongoDB error: {str(e)}")
