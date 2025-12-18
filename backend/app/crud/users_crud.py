from app.database.mysql_connection import get_connection
from app.schemas.schemas import UserSchema
from app.models.models import UserReqRes
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException


def _ensure_roles_list(roles):
    # Normalize roles to a Python list
    if roles is None:
        return []
    if isinstance(roles, list):
        return roles
    # If stored as a JSON string or comma-separated string
    if isinstance(roles, str):
        # try JSON-style list
        try:
            import json
            parsed = json.loads(roles)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
        # fallback to comma-separated
        return [r.strip() for r in roles.split(",") if r.strip()]
    # otherwise coerce to list
    return list(roles)


def add_user(new_user: UserReqRes):
    try:
        session = get_connection()
        user = UserSchema(
            e_id=new_user.e_id,
            password=new_user.password or "password123",
            roles=new_user.roles,
            status=new_user.status
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        res = UserReqRes(
            e_id=user.e_id,
            password=user.password,
            roles=_ensure_roles_list(user.roles),
            status=user.status
        )
        return res
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()


def get_all_users():
    try:
        session = get_connection()
        users = session.query(UserSchema).all()
        res = []
        for u in users:
            res.append(UserReqRes(
                e_id=u.e_id,
                password=u.password,
                roles=_ensure_roles_list(u.roles),
                status=u.status
            ))
        return res
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()


def get_user_by_id(e_id: int):
    try:
        session = get_connection()
        u = session.query(UserSchema).filter(UserSchema.e_id == e_id).first()
        if not u:
            raise HTTPException(status_code=404, detail="User Not Found")
        return UserReqRes(e_id=u.e_id, password=u.password, roles=_ensure_roles_list(u.roles), status=u.status)
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()


def update_user(e_id: int, updated: dict):
    try:
        session = get_connection()
        u = session.query(UserSchema).filter(UserSchema.e_id == e_id).first()
        if not u:
            raise HTTPException(status_code=404, detail="User Not Found")
        if "roles" in updated:
            # normalize to stored representation (JSON/list supported by SQLAlchemy JSON)
            updated["roles"] = updated["roles"] if updated["roles"] is not None else u.roles
        for key, value in updated.items():
            setattr(u, key, value)
        session.commit()
        session.refresh(u)
        return UserReqRes(e_id=u.e_id, password=u.password, roles=_ensure_roles_list(u.roles), status=u.status)
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()


def delete_user(e_id: int):
    try:
        session = get_connection()
        u = session.query(UserSchema).filter(UserSchema.e_id == e_id).first()
        if not u:
            raise HTTPException(status_code=404, detail="User Not Found")
        session.delete(u)
        session.commit()
        return {"detail": "User Deleted Successfully"}
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()