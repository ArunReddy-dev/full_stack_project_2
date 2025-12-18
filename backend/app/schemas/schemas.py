from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SAEnum, JSON
# from database.mysql_connection import Base, engine

DATABASE_URL = "mysql+pymysql://root:password123@localhost:3306/ust_emp_manag"
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Shared Base for all schema modules so ForeignKey references resolve
Base = declarative_base()

class EmployeeSchema(Base):
    __tablename__ = "employees"
    e_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    email=Column(String(100),unique=True,nullable=False)
    designation= Column(String(50), nullable=False)  
    mgr_id=Column(Integer,nullable=False)
    
    def __repr__(self):
        return f"<Employee(e_id={self.e_id}, name={self.name}, email={self.email}, designation={self.designation}, manager id={self.mgr_id})>"
    

class TaskStatus(str, PyEnum):
    TO_DO = "to_do"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"


class TaskPriority(str, PyEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskSchema(Base):
    __tablename__ = "tasks"
    t_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description=Column(String(250),unique=True,nullable=False)
    assigned_to= Column(Integer, ForeignKey("employees.e_id"))  
    assigned_by=Column(Integer, ForeignKey("employees.e_id"))
    assigned_at=Column(DateTime)
    updated_by=Column(Integer, ForeignKey("employees.e_id"))
    updated_at=Column(DateTime)
    priority = Column(SAEnum(TaskPriority), nullable=False)
    status = Column(SAEnum(TaskStatus), nullable=False)
    reviewer=Column(Integer, ForeignKey("employees.e_id"))
    created_by=Column(Integer, ForeignKey("employees.e_id"))
    expected_closure=Column(DateTime,nullable=False)
    actual_closure=Column(DateTime)
    # attachments will be stored in a separate table
    
    def __repr__(self):
        return f"<Task(t_id={self.t_id}, title={self.title}, status={self.status})>"

    
class UserRole(str, PyEnum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    DEVELOPER = "Developer"


class UserStatus(str, PyEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class UserSchema(Base):
    __tablename__ = "users"
    e_id = Column(Integer, primary_key=True, index=True)
    password = Column(String(100), nullable=False)
    roles = Column(JSON, nullable=False) 
    status = Column(SAEnum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    def __repr__(self):
        return f"<User(e_id={self.e_id}, roles={self.roles}, status={self.status})>"


class AttachmentSchema(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.t_id"), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(512), nullable=False)
    remark = Column(String(1000))
    created_by = Column(Integer, ForeignKey("employees.e_id"))
    created_at = Column(DateTime, default=datetime.now)

    def __repr__(self):
        return f"<Attachment(id={self.id}, task_id={self.task_id}, filename={self.filename})>"


Base.metadata.create_all(bind=engine)


