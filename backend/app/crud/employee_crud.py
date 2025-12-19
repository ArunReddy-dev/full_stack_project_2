from app.database.mysql_connection import get_connection
from app.models.models import EmployeeReqRes  # Pydantic Model
from app.schemas.schemas import EmployeeSchema
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException


def add_emplyee(new_emp: EmployeeReqRes):
    try:
        session = get_connection()
        new_employee = EmployeeSchema(
            name=new_emp.name,
            email=new_emp.email,
            designation=new_emp.designation,
            mgr_id=new_emp.mgr_id
        )
        session.add(new_employee)
        session.commit()
        session.refresh(new_employee)
        return EmployeeReqRes.model_validate(new_employee)  # Convert to Pydantic model
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()


def get_all_employees(mgr_id: int | None = None, designation: str | None = None):
    """Return all employees, or filter by manager id and/or designation.

    Args:
        mgr_id: optional manager employee id to filter employees who report to this manager
        designation: optional designation (e.g. 'Developer', 'Manager') to filter by role/title
    """
    try:
        session = get_connection()
        query = session.query(EmployeeSchema)
        if mgr_id is not None:
            query = query.filter(EmployeeSchema.mgr_id == mgr_id)
        if designation:
            # simple case-insensitive match
            query = query.filter(EmployeeSchema.designation.ilike(f"%{designation}%"))

        employees = query.all()
        return [EmployeeReqRes.model_validate(emp) for emp in employees]  # Convert to list of Pydantic models
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()


def get_by_employee_id(id: int):
    try:
        session = get_connection()
        emp = session.query(EmployeeSchema).filter(EmployeeSchema.e_id == id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee Not Found")
        return EmployeeReqRes.model_validate(emp)  # Convert to Pydantic model
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()


def update_employee(id: int, updated: dict):
    try:
        session = get_connection()
        emp = session.query(EmployeeSchema).filter(EmployeeSchema.e_id == id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee Not Found")
        for key, value in updated.items():
            setattr(emp, key, value)
        session.commit()
        session.refresh(emp)
        return EmployeeReqRes.model_validate(emp)  # Convert to Pydantic model
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()


def delete_employee(id: int):
    try:
        session = get_connection()
        emp = session.query(EmployeeSchema).filter(EmployeeSchema.e_id == id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee Not Found")

        # Prevent deletion if this employee is referenced by any tasks (strong FK constraints)
        from app.schemas.schemas import TaskSchema

        refs = session.query(TaskSchema).filter(
            (TaskSchema.assigned_to == id)
            | (TaskSchema.assigned_by == id)
            | (TaskSchema.reviewer == id)
            | (TaskSchema.created_by == id)
            | (TaskSchema.updated_by == id)
        ).all()

        if refs and len(refs) > 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Employee cannot be deleted: referenced by {len(refs)} task(s). "
                    "Reassign or remove those tasks before deleting the employee."
                ),
            )

        session.delete(emp)
        session.commit()
        return {"detail": "Employee Deleted Successfully"}
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()