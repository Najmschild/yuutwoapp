from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date, timedelta
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class FlowIntensity(str, Enum):
    LIGHT = "light"
    MEDIUM = "medium"
    HEAVY = "heavy"

class CyclePhase(str, Enum):
    MENSTRUAL = "menstrual"
    FOLLICULAR = "follicular"
    OVULATION = "ovulation"
    LUTEAL = "luteal"

# Models
class Period(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"  # For now, single user
    start_date: date
    end_date: Optional[date] = None
    flow_intensity: FlowIntensity = FlowIntensity.MEDIUM
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PeriodCreate(BaseModel):
    start_date: date
    end_date: Optional[date] = None
    flow_intensity: FlowIntensity = FlowIntensity.MEDIUM
    notes: Optional[str] = None

class PeriodUpdate(BaseModel):
    end_date: Optional[date] = None
    flow_intensity: Optional[FlowIntensity] = None
    notes: Optional[str] = None

class CycleData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    period_start: date
    period_end: Optional[date] = None
    cycle_length: Optional[int] = None
    ovulation_date: Optional[date] = None
    fertile_window_start: Optional[date] = None
    fertile_window_end: Optional[date] = None
    phase: CyclePhase = CyclePhase.MENSTRUAL

class DayInfo(BaseModel):
    date: date
    phase: Optional[CyclePhase] = None
    is_period: bool = False
    is_predicted_period: bool = False
    is_ovulation: bool = False
    is_fertile: bool = False
    flow_intensity: Optional[FlowIntensity] = None
    notes: Optional[str] = None

class CyclePrediction(BaseModel):
    next_period_start: Optional[date] = None
    next_period_end: Optional[date] = None
    next_ovulation: Optional[date] = None
    next_fertile_start: Optional[date] = None
    next_fertile_end: Optional[date] = None
    average_cycle_length: Optional[float] = None
    cycle_regularity: str = "Unknown"

# Helper functions
def calculate_cycle_predictions(periods: List[Period]) -> CyclePrediction:
    """Calculate cycle predictions based on historical period data"""
    if not periods or len(periods) < 2:
        return CyclePrediction()
    
    # Sort periods by start date
    sorted_periods = sorted(periods, key=lambda p: p.start_date)
    
    # Calculate cycle lengths
    cycle_lengths = []
    for i in range(1, len(sorted_periods)):
        prev_start = sorted_periods[i-1].start_date
        curr_start = sorted_periods[i].start_date
        cycle_length = (curr_start - prev_start).days
        if 15 <= cycle_length <= 45:  # Filter unrealistic cycle lengths
            cycle_lengths.append(cycle_length)
    
    if not cycle_lengths:
        return CyclePrediction()
    
    # Calculate average cycle length
    avg_cycle_length = sum(cycle_lengths) / len(cycle_lengths)
    
    # Determine regularity
    if len(cycle_lengths) >= 3:
        std_dev = (sum((x - avg_cycle_length) ** 2 for x in cycle_lengths) / len(cycle_lengths)) ** 0.5
        if std_dev <= 3:
            regularity = "Regular"
        elif std_dev <= 7:
            regularity = "Somewhat Regular"
        else:
            regularity = "Irregular"
    else:
        regularity = "Not enough data"
    
    # Predict next cycle
    last_period = sorted_periods[-1]
    next_period_start = last_period.start_date + timedelta(days=int(avg_cycle_length))
    next_period_end = next_period_start + timedelta(days=5)  # Average period length
    
    # Predict ovulation (typically 14 days before next period)
    next_ovulation = next_period_start - timedelta(days=14)
    
    # Fertile window (5 days before ovulation + ovulation day)
    next_fertile_start = next_ovulation - timedelta(days=5)
    next_fertile_end = next_ovulation + timedelta(days=1)
    
    return CyclePrediction(
        next_period_start=next_period_start,
        next_period_end=next_period_end,
        next_ovulation=next_ovulation,
        next_fertile_start=next_fertile_start,
        next_fertile_end=next_fertile_end,
        average_cycle_length=round(avg_cycle_length, 1),
        cycle_regularity=regularity
    )

def get_day_phase(target_date: date, periods: List[Period], predictions: CyclePrediction) -> CyclePhase:
    """Determine what phase a specific date falls in"""
    # Check if it's during a recorded period
    for period in periods:
        if period.start_date <= target_date <= (period.end_date or period.start_date + timedelta(days=5)):
            return CyclePhase.MENSTRUAL
    
    # Check if it's a predicted period
    if predictions.next_period_start and predictions.next_period_end:
        if predictions.next_period_start <= target_date <= predictions.next_period_end:
            return CyclePhase.MENSTRUAL
    
    # Check if it's ovulation
    if predictions.next_ovulation and target_date == predictions.next_ovulation:
        return CyclePhase.OVULATION
    
    # Check if it's fertile window
    if (predictions.next_fertile_start and predictions.next_fertile_end and 
        predictions.next_fertile_start <= target_date <= predictions.next_fertile_end):
        return CyclePhase.FOLLICULAR
    
    # Default to luteal phase
    return CyclePhase.LUTEAL

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Menstrual Cycle Tracker API"}

@api_router.post("/periods", response_model=Period)
async def create_period(period_data: PeriodCreate):
    """Create a new period entry"""
    period = Period(**period_data.dict())
    result = await db.periods.insert_one(period.dict())
    return period

@api_router.get("/periods", response_model=List[Period])
async def get_periods():
    """Get all periods for the user"""
    periods = await db.periods.find({"user_id": "default_user"}).to_list(1000)
    return [Period(**period) for period in periods]

@api_router.put("/periods/{period_id}", response_model=Period)
async def update_period(period_id: str, period_update: PeriodUpdate):
    """Update an existing period"""
    update_data = {k: v for k, v in period_update.dict().items() if v is not None}
    
    result = await db.periods.update_one(
        {"id": period_id, "user_id": "default_user"},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Period not found")
    
    updated_period = await db.periods.find_one({"id": period_id})
    return Period(**updated_period)

@api_router.delete("/periods/{period_id}")
async def delete_period(period_id: str):
    """Delete a period entry"""
    result = await db.periods.delete_one({"id": period_id, "user_id": "default_user"})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Period not found")
    
    return {"message": "Period deleted successfully"}

@api_router.get("/cycle-predictions", response_model=CyclePrediction)
async def get_cycle_predictions():
    """Get cycle predictions based on historical data"""
    periods = await db.periods.find({"user_id": "default_user"}).to_list(1000)
    period_objects = [Period(**period) for period in periods]
    return calculate_cycle_predictions(period_objects)

@api_router.get("/calendar/{year}/{month}")
async def get_calendar_data(year: int, month: int):
    """Get calendar data for a specific month"""
    # Get periods
    periods = await db.periods.find({"user_id": "default_user"}).to_list(1000)
    period_objects = [Period(**period) for period in periods]
    
    # Get predictions
    predictions = calculate_cycle_predictions(period_objects)
    
    # Generate calendar data for the month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    calendar_data = []
    current_date = start_date
    
    while current_date <= end_date:
        # Find if this date has a period
        period_info = None
        for period in period_objects:
            if period.start_date <= current_date <= (period.end_date or period.start_date + timedelta(days=5)):
                period_info = period
                break
        
        # Determine day info
        day_info = DayInfo(
            date=current_date,
            phase=get_day_phase(current_date, period_objects, predictions),
            is_period=period_info is not None,
            is_predicted_period=(
                predictions.next_period_start and predictions.next_period_end and
                predictions.next_period_start <= current_date <= predictions.next_period_end
            ),
            is_ovulation=(predictions.next_ovulation == current_date),
            is_fertile=(
                predictions.next_fertile_start and predictions.next_fertile_end and
                predictions.next_fertile_start <= current_date <= predictions.next_fertile_end
            ),
            flow_intensity=period_info.flow_intensity if period_info else None,
            notes=period_info.notes if period_info else None
        )
        
        calendar_data.append(day_info)
        current_date += timedelta(days=1)
    
    return {
        "calendar_data": calendar_data,
        "predictions": predictions,
        "month": month,
        "year": year
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()