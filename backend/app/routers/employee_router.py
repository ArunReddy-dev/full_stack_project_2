from fastapi import APIRouter, HTTPException
from app.crud.employee_crud import get_all_employees, add_emplyee, get_by_employee_id, update_employee, delete_employee
from app.models.models import EmployeeReqRes
from typing import List

employee_router = APIRouter(prefix="/Employee", tags=["Employee"])

@employee_router.get("/getall", response_model=List[EmployeeReqRes])
def get_all(mgr_id: int | None = None, designation: str | None = None):
    try:
        employees = get_all_employees(mgr_id=mgr_id, designation=designation)
        if employees is None or (isinstance(employees, list) and len(employees) == 0):
            # return empty list instead of 404 so callers can safely iterate
            return []
        return employees
    except HTTPException as e:
        raise e  # Re-raise the specific HTTPException
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@employee_router.post("/create")
def add_new_employee(new_emp: EmployeeReqRes):
    try:
        new_employee = add_emplyee(new_emp)
        return {"detail": "Employee Added Successfully", "employee": new_employee}
    except HTTPException as e:
        raise e  # Re-raise the specific HTTPException
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@employee_router.get("/get", response_model=EmployeeReqRes)
def get_by_id(id: int):
    try:
        emp = get_by_employee_id(id)
        return emp
    except HTTPException as e:
        raise e  # Re-raise the specific HTTPException
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@employee_router.put("/update")
def update_employee_data(id: int, new_data: dict):
    try:
        updated_emp = update_employee(id, new_data)
        return {"detail": "Employee Updated Successfully", "employee": updated_emp}
    except HTTPException as e:
        raise e  # Re-raise the specific HTTPException
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@employee_router.delete("/delete")
def delete_employee_by_id(id: int):
    try:
        delete_response = delete_employee(id)
        return delete_response  # Returns {"detail": "Employee Deleted Successfully"}
    except HTTPException as e:
        raise e  # Re-raise the specific HTTPException
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")