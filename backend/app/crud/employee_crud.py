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


def get_all_employees():
    try:
        session = get_connection()
        employees = session.query(EmployeeSchema).all()
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
        session.delete(emp)
        session.commit()
        return {"detail": "Employee Deleted Successfully"}
    except SQLAlchemyError as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()