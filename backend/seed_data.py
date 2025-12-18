"""
Seed script to populate database with sample data
Run this after init_db.py to create demo users and tasks
"""

from app.database.mysql_connection import SessionLocal
from app.models.models import Employee, User, Task
from datetime import datetime, timedelta
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_database():
    """Populate database with sample data"""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_employees = db.query(Employee).count()
        if existing_employees > 0:
            print("⚠️  Database already contains data. Skipping seed.")
            return
        
        print("Seeding database with sample data...")
        
        # Create Employees
        admin_emp = Employee(
            name="Admin User",
            email="admin@ust.com",
            designation="System Administrator"
        )
        db.add(admin_emp)
        db.flush()
        
        manager_emp = Employee(
            name="Manager User",
            email="manager@ust.com",
            designation="Project Manager",
            mgr_id=admin_emp.e_id
        )
        db.add(manager_emp)
        db.flush()
        
        dev1_emp = Employee(
            name="Developer One",
            email="dev1@ust.com",
            designation="Senior Developer",
            mgr_id=manager_emp.e_id
        )
        db.add(dev1_emp)
        db.flush()
        
        dev2_emp = Employee(
            name="Developer Two",
            email="dev2@ust.com",
            designation="Junior Developer",
            mgr_id=manager_emp.e_id
        )
        db.add(dev2_emp)
        db.flush()
        
        # Create Users
        admin_user = User(
            e_id=admin_emp.e_id,
            password="password123",  # In production, this should be hashed
            role="Admin",
            status="active"
        )
        db.add(admin_user)
        
        manager_user = User(
            e_id=manager_emp.e_id,
            password="password123",
            role="Manager",
            status="active"
        )
        db.add(manager_user)
        
        dev1_user = User(
            e_id=dev1_emp.e_id,
            password="password123",
            role="Developer",
            status="active"
        )
        db.add(dev1_user)
        
        dev2_user = User(
            e_id=dev2_emp.e_id,
            password="password123",
            role="Developer",
            status="active"
        )
        db.add(dev2_user)
        
        # Create Sample Tasks
        task1 = Task(
            title="Setup Development Environment",
            description="Install and configure all necessary development tools",
            created_by=manager_emp.e_id,
            assigned_to=dev1_emp.e_id,
            assigned_by=manager_emp.e_id,
            assigned_at=datetime.now(),
            priority="high",
            status="in_progress",
            reviewer=manager_emp.e_id,
            expected_closure=datetime.now() + timedelta(days=3)
        )
        db.add(task1)
        
        task2 = Task(
            title="Implement User Authentication",
            description="Create JWT-based authentication system with role-based access control",
            created_by=manager_emp.e_id,
            assigned_to=dev1_emp.e_id,
            assigned_by=manager_emp.e_id,
            assigned_at=datetime.now(),
            priority="high",
            status="review",
            reviewer=manager_emp.e_id,
            expected_closure=datetime.now() + timedelta(days=5)
        )
        db.add(task2)
        
        task3 = Task(
            title="Design Database Schema",
            description="Create ERD and implement database models for all entities",
            created_by=manager_emp.e_id,
            assigned_to=dev2_emp.e_id,
            assigned_by=manager_emp.e_id,
            assigned_at=datetime.now(),
            priority="medium",
            status="done",
            reviewer=manager_emp.e_id,
            expected_closure=datetime.now() + timedelta(days=2),
            actual_closure=datetime.now()
        )
        db.add(task3)
        
        task4 = Task(
            title="Create API Documentation",
            description="Document all API endpoints with examples and response schemas",
            created_by=manager_emp.e_id,
            priority="medium",
            status="to_do",
            expected_closure=datetime.now() + timedelta(days=7)
        )
        db.add(task4)
        
        task5 = Task(
            title="Implement Kanban Board",
            description="Create drag-and-drop kanban board with status columns",
            created_by=admin_emp.e_id,
            assigned_to=dev2_emp.e_id,
            assigned_by=manager_emp.e_id,
            assigned_at=datetime.now(),
            priority="high",
            status="in_progress",
            reviewer=manager_emp.e_id,
            expected_closure=datetime.now() + timedelta(days=4)
        )
        db.add(task5)
        
        # Commit all changes
        db.commit()
        
        print("✅ Database seeded successfully!")
        print("\n📊 Sample data created:")
        print(f"  - Employees: 4")
        print(f"  - Users: 4")
        print(f"  - Tasks: 5")
        print("\n🔐 Login credentials:")
        print(f"  Admin:     Employee ID: {admin_emp.e_id}, Password: password123")
        print(f"  Manager:   Employee ID: {manager_emp.e_id}, Password: password123")
        print(f"  Developer: Employee ID: {dev1_emp.e_id}, Password: password123")
        print(f"  Developer: Employee ID: {dev2_emp.e_id}, Password: password123")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

