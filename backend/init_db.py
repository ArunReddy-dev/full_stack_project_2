"""
Database initialization script
Run this script to create all database tables
"""

from app.database.mysql_connection import engine, Base
from app.models.models import EmployeeReqRes, UserReqRes, TaskReqRes

def init_database():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
    print("\nTables created:")
    print("  - employees")
    print("  - users")
    print("  - tasks")
    print("\nYou can now start the server with: python -m uvicorn main:app --reload")

if __name__ == "__main__":
    init_database()

