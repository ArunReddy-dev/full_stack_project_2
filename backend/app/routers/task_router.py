from fastapi import APIRouter, HTTPException, Depends
from app.crud.task_crud import add_task, get_all_tasks, get_task_by_id,get_task_by_status,patch_status,update_task, delete_task
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
        if role not in user.roles:
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
        if role not in user.roles:
            raise HTTPException(status_code=409,detail="The user doesnt have the mentioned role")
        if role=="Admin" and new_data["status"]:
            raise HTTPException(status_code=409,detail="Admin cannout update the status of task") 
        updated = update_task(id, new_data,role,user)
        return {"detail": "Task Updated Successfully", "task": updated}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@task_router.patch("/patch")
def patch_stat(id,status,role,user=Depends(get_current_user)):
    try:
        if role not in user.roles and role.upper() !="ADMIN":
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
        if role.upper()!="ADMIN" and role not in user.roles:
            raise HTTPException(status_code=409,detail="Only the Admin can delete the task")
        resp = delete_task(role,user,id)
        return resp
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")