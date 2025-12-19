from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
import os
from app.crud.task_crud import add_task, get_all_tasks, get_task_by_id,get_task_by_status,patch_status,update_task, delete_task
from app.crud.attachment_crud import add_attachment, get_attachments
from app.crud.attachment_crud import delete_attachment_by_id, delete_attachments_by_task_and_creator
from app.core.security import get_current_user
from app.models.models import TaskReqRes, UserRole
from typing import List

task_router = APIRouter(prefix="/Task", tags=["Task"])


@task_router.get("/getall", response_model=List[TaskReqRes])
def get_all(role: UserRole,user=Depends(get_current_user)):
    try:
        tasks = get_all_tasks(role,user)
        if not tasks:
            raise HTTPException(status_code=404, detail="No tasks found")
        return tasks
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@task_router.get("/getbystatus",response_model=List[TaskReqRes])
def get_by_status(status,role,user=Depends(get_current_user)):
    try:
        # allow Admin to assume other roles
        if role not in user.roles and "Admin" not in user.roles:
            raise HTTPException(status_code=409,detail="The user doesnt have the mentioned role")
        return get_task_by_status(status,role,user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@task_router.post("/create")
def add_new_task(role: UserRole,new_task: TaskReqRes,user=Depends(get_current_user)):
    try:
        if role != "Manager" and role != "Admin":
            raise HTTPException(status_code=409,detail="The user doesnt have the mentioned role")
        t = add_task(new_task,role,user)
        return {"detail": "Task Added Successfully", "task": t}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@task_router.get("/get", response_model=TaskReqRes)
def get_by_id(id: int,user=Depends(get_current_user)):
    try:
        t = get_task_by_id(id,user)
        return t
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@task_router.put("/update")
def update_task_data(id: int, new_data: dict,role,user=Depends(get_current_user)):
    try:
        # allow Admin to assume other roles
        if role not in user.roles and "Admin" not in user.roles:
            raise HTTPException(status_code=409, detail="The user doesnt have the mentioned role")

        # allow Admins and Managers to update tasks (Admin may not act as reviewer)
        updated = update_task(id, new_data, role, user)
        return {"detail": "Task Updated Successfully", "task": updated}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@task_router.patch("/patch")
def patch_stat(id,status,role,user=Depends(get_current_user)):
    try:
        # allow Admin to assume other roles
        if role not in user.roles and "Admin" not in user.roles:
            raise HTTPException(status_code=409,detail="The user doesnt have the mentioned role")
        patched=patch_status(id,status,role,user)
        return {"detail":"Patched the task"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@task_router.delete("/delete")
def delete_task_by_id(id: int,role,user=Depends(get_current_user)):
    try:
        # delete allowed only when acting as Admin (or if user actually has Admin role)
        if role.upper()!="ADMIN" and "Admin" not in user.roles:
            raise HTTPException(status_code=409,detail="Only the Admin can delete the task")
        resp = delete_task(role,user,id)
        return resp
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@task_router.post("/attach")
def attach_file(
    id: int,
    role: str = Form(...),
    remark: str = Form(""),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    """
    Attach a file to a task. Expects multipart/form-data with file and remark.
    Form fields: role (string), remark (optional), file (UploadFile). Query param id (task id) required.
    """
    try:
        # role validation
        # allow Admin to assume other roles
        if role and role not in user.roles and "Admin" not in user.roles:
            raise HTTPException(status_code=409, detail="The user doesnt have the mentioned role")

        # remove previous attachments by this user for this task (replacement behaviour)
        try:
            delete_attachments_by_task_and_creator(int(id), getattr(user, "e_id", None))
        except Exception:
            # don't block upload if cleanup fails
            pass

        # save file to uploads/<task_id>/filename
        uploads_dir = os.path.join(os.getcwd(), "uploads")
        task_dir = os.path.join(uploads_dir, str(id))
        os.makedirs(task_dir, exist_ok=True)
        dest_path = os.path.join(task_dir, file.filename)
        with open(dest_path, "wb") as out_file:
            content = file.file.read()
            out_file.write(content)

        # record attachment in DB
        att = add_attachment(int(id), file.filename, dest_path, remark, user)
        return {"detail": "Attachment saved", "attachment": att}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@task_router.get("/attachments")
def list_attachments(id: int, role, user=Depends(get_current_user)):
    try:
        # permission: managers/admins can view, developers can view only their assigned tasks
        if role == "Manager" and "Manager" not in user.roles:
            raise HTTPException(status_code=403, detail="Not Authorized")
        if role == "Developer" and "Developer" not in user.roles:
            raise HTTPException(status_code=403, detail="Not Authorized")

        attachments = get_attachments(int(id))
        return attachments
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")



@task_router.delete("/attachment")
def delete_attachment(id: int, role: str, user=Depends(get_current_user)):
    """Delete an attachment by its DB id. Requires role and current user (permission enforced in CRUD)."""
    try:
        # role validation: allow Admin/Manager/Developer checks via existing security
        if role and role not in user.roles and "Admin" not in user.roles:
            raise HTTPException(status_code=409, detail="The user doesnt have the mentioned role")

        resp = delete_attachment_by_id(int(id), user=user)
        return resp
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")