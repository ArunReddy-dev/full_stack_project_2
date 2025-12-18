from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class EmployeeReqRes(BaseModel):
    e_id: Optional[int] = None  # Optional for creating, required for updating
    name: str = Field(..., pattern=r"^[a-zA-Zà-ÿÀ-ÿ' -]+$", description="Name should contain only letters, spaces, and hyphens.")
    email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@ust\.com$", description="Email must be valid and end with @ust.com")
    designation: str = Field(..., pattern=r"^[a-zA-Z0-9\s\-]+$", description="Designation should contain only letters, spaces, numbers, and allowed special characters.")
    mgr_id: int = Field(..., description="Manager ID must be given and should be an integer.")

    class Config:
        orm_mode = True  # Ensures compatibility with SQLAlchemy models
        from_attributes = True
        

class RemarkReqRes(BaseModel):
    _id: Optional[str] = None
    task_id: int = Field(...)
    comment: str = Field(..., max_length=1000)
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class TaskStatus(str, Enum):
    TO_DO = "to_do"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

# Task priority enum
class TaskPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskReqRes(BaseModel):
    t_id: Optional[int] = None
    title: str = Field(..., max_length=100)
    description: str = Field(..., max_length=250)
    assigned_to: Optional[int] = None
    assigned_by: Optional[int] = None
    assigned_at: Optional[datetime] = None
    updated_by: Optional[int] = None
    updated_at: Optional[datetime] = None
    priority: TaskPriority = Field(..., description="high, medium, low")
    status: Optional[TaskStatus] = Field(default=TaskStatus.TO_DO)
    reviewer: Optional[int] = None
    created_by: Optional[int] = None
    expected_closure: datetime
    actual_closure: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True


class UserRole(str, Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    DEVELOPER = "Developer"

# User status enum
class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class UserReqRes(BaseModel):
    e_id: Optional[int] = None
    password: Optional[str] = Field(None, min_length=6)
    roles: List[UserRole] = Field(..., description="List of roles: Admin, Manager, Developer")
    status: UserStatus = Field(..., description="active or inactive")

    class Config:
        orm_mode = True
        from_attributes = True
        


class LoginRequest(BaseModel):
    e_id: int
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    
    
   