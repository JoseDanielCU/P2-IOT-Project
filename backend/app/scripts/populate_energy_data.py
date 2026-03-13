"""
Script to populate the database with synthetic energy production and consumption data.
Generates realistic daily data for the past 30 days for each user.

ejecutar con docker:
docker-compose -f docker-compose.dev.yml exec backend python /app/app/scripts/populate_energy_data.py
"""
import sys
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.auth.models import User
from app.energy.models import EnergyData


def generate_energy_data():
    """Generate synthetic energy data for all users"""
    db = SessionLocal()
    
    try:
        # Get all active users
        users = db.query(User).filter(User.is_active == True).all()
        
        if not users:
            print("❌ No active users found in database")
            return
        
        print(f"📊 Generating energy data for {len(users)} users...")
        
        # Generate data for the past 30 days
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=29)
        
        total_records = 0
        
        for user in users:
            print(f"\n👤 User: {user.email} (ID: {user.id})")
            
            # Check if user already has data
            existing_count = db.query(EnergyData).filter(
                EnergyData.user_id == user.id
            ).count()
            
            if existing_count > 0:
                print(f"   ⏭️  Skipping - already has {existing_count} records")
                continue
            
            user_records = 0
            current_date = start_date
            
            while current_date <= end_date:
                # Generate realistic energy values (in kWh)
                # Morning peak: 6-9 AM (high production, low consumption)
                # Afternoon peak: 12-3 PM (moderate production, moderate consumption)
                # Evening peak: 6-9 PM (low production, high consumption)
                
                for hour in range(24):
                    timestamp = datetime.combine(current_date, datetime.min.time()).replace(hour=hour)
                    
                    if 6 <= hour < 9:  # Morning
                        produced = random.uniform(8.0, 12.0)
                        consumed = random.uniform(2.0, 4.0)
                    elif 12 <= hour < 15:  # Afternoon
                        produced = random.uniform(10.0, 14.0)
                        consumed = random.uniform(3.0, 5.0)
                    elif 18 <= hour < 21:  # Evening
                        produced = random.uniform(2.0, 6.0)
                        consumed = random.uniform(6.0, 10.0)
                    elif 21 <= hour or hour < 6:  # Night (6 PM - 6 AM)
                        produced = random.uniform(0.0, 1.0)
                        consumed = random.uniform(1.0, 3.0)
                    else:  # Rest of day
                        produced = random.uniform(4.0, 8.0)
                        consumed = random.uniform(2.0, 4.0)
                    
                    # Add some random variation
                    produced *= random.uniform(0.8, 1.2)
                    consumed *= random.uniform(0.8, 1.2)
                    
                    # Generate data based on user's primary role
                    if user.primary_role.value == 'producer':
                        # Producer: only generation data
                        final_produced = round(max(0, produced), 2)
                        final_consumed = 0.0
                    elif user.primary_role.value == 'consumer':
                        # Consumer: only consumption data
                        final_produced = 0.0
                        final_consumed = round(max(0, consumed), 2)
                    else:  # prosumer
                        # Prosumer: both generation and consumption
                        final_produced = round(max(0, produced), 2)
                        final_consumed = round(max(0, consumed), 2)
                    
                    energy_record = EnergyData(
                        user_id=user.id,
                        timestamp=timestamp,
                        energy_produced_kwh=final_produced,
                        energy_consumed_kwh=final_consumed,
                    )
                    db.add(energy_record)
                    user_records += 1
                
                current_date += timedelta(days=1)
            
            db.commit()
            total_records += user_records
            print(f"   ✓ Created {user_records} records")
        
        print(f"\n✅ Success! Created {total_records} energy records")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    try:
        generate_energy_data()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)
