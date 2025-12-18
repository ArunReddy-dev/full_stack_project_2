from fastapi import APIRouter, HTTPException
from app.crud.users_crud import add_user, get_all_users, get_user_by_id, update_user, delete_user
from app.models.models import UserReqRes
from typing import List

users_router = APIRouter(prefix="/Users", tags=["Users"])


@users_router.get("/getall", response_model=List[UserReqRes])
def get_all():
    try:
        users = get_all_users()
        if not users:
            raise HTTPException(status_code=404, detail="No users found")
        return users
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@users_router.post("/create")
def add_new_user(new_user: UserReqRes):
    try:
        u = add_user(new_user)
        return {"detail": "User Added Successfully", "user": u}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@users_router.get("/get", response_model=UserReqRes)
def get_by_id(id: int):
    try:
        u = get_user_by_id(id)
        return u
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@users_router.put("/update")
def update_user_data(id: int, new_data: dict):
    try:
        updated = update_user(id, new_data)
        return {"detail": "User Updated Successfully", "user": updated}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@users_router.delete("/delete")
def delete_user_by_id(id: int):
    try:
        resp = delete_user(id)
        return resp
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")