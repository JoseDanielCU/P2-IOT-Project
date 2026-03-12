"""
Reset the database - drops all tables and recreates them from models.
Use this in development only when schema has changed.
"""
import sys
import os

# Add parent directory to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect
from core.database import Base, engine
from auth.models import User
from energy.models import EnergyData

def reset_database():
    """Drop all tables and recreate them"""
    print("⚠️  Resetting database...")
    
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    print("✓ Dropped all tables")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Created all tables from models")
    
    # Verify tables exist
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n📊 Database tables created:")
    for table in tables:
        columns = [col['name'] for col in inspector.get_columns(table)]
        print(f"  - {table}: {', '.join(columns)}")
    
    print("\n✓ Database reset complete!")

if __name__ == "__main__":
    try:
        reset_database()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
