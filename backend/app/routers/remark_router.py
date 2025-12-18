from fastapi import APIRouter, HTTPException
# from app.crud.remark_crud import add_remark, get_remarks_for_task, delete_remark
from app.models.models import RemarkReqRes
from typing import List

remark_router = APIRouter(prefix="/Remark", tags=["Remark"])
from fastapi import APIRouter, HTTPException
from fastapi import APIRouter, UploadFile, File, Header, Form
from app.crud.remarks_crud import add_remark, get_remarks_by_task, delete_remark_by_id
from app.crud.remarks_crud import update_remark
 
remark_router = APIRouter(prefix="/api/remarks", tags=["Remarks"])

 
@remark_router.get("/task/{task_id}")
def list_remarks(task_id: int):
    return get_remarks_by_task(task_id)
 
 
@remark_router.post("/create")
def create_remark(
    task_id: int,
    comment: str,
    e_id: int = Header(...),  # <-- THIS IS e_id
    file: UploadFile | None = File(None)
):
    return add_remark(
        task_id=task_id,
        comment=comment,
        e_id=e_id,
        file=file
    )


@remark_router.delete("/{remark_id}")
def delete_remark(remark_id: str):
    try:
        return delete_remark_by_id(remark_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
 


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