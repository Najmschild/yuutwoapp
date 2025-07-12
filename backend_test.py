#!/usr/bin/env python3
"""
Backend API Testing for Menstrual Cycle Tracking App
Tests all CRUD operations, calendar data, and cycle predictions
"""

import requests
import json
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
import sys

# Backend URL from environment
BACKEND_URL = "https://c5478efe-e386-4db4-92b3-24da477b0837.preview.emergentagent.com/api"

class MenstrualCycleAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.created_period_ids = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        print(f"[{level}] {message}")
        
    def test_api_connection(self) -> bool:
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                self.log("✅ API connection successful")
                return True
            else:
                self.log(f"❌ API connection failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ API connection error: {str(e)}", "ERROR")
            return False
    
    def create_test_period(self, start_date: str, end_date: str = None, 
                          flow_intensity: str = "medium", notes: str = None) -> Dict[str, Any]:
        """Create a test period entry"""
        period_data = {
            "start_date": start_date,
            "flow_intensity": flow_intensity
        }
        if end_date:
            period_data["end_date"] = end_date
        if notes:
            period_data["notes"] = notes
            
        try:
            response = self.session.post(f"{self.base_url}/periods", json=period_data)
            if response.status_code == 200:
                period = response.json()
                self.created_period_ids.append(period["id"])
                self.log(f"✅ Created period: {period['id']} ({start_date})")
                return period
            else:
                self.log(f"❌ Failed to create period: {response.status_code} - {response.text}", "ERROR")
                return None
        except Exception as e:
            self.log(f"❌ Error creating period: {str(e)}", "ERROR")
            return None
    
    def test_period_crud_operations(self) -> bool:
        """Test all Period CRUD operations"""
        self.log("\n=== Testing Period CRUD Operations ===")
        
        # Test 1: Create periods with realistic data
        self.log("Testing POST /api/periods...")
        
        # Create multiple periods to test cycle calculations
        test_periods = [
            {
                "start_date": "2025-04-15",
                "end_date": "2025-04-20",
                "flow_intensity": "heavy",
                "notes": "Spring cycle"
            },
            {
                "start_date": "2025-05-12",
                "end_date": "2025-05-17",
                "flow_intensity": "medium",
                "notes": "Regular cycle"
            },
            {
                "start_date": "2025-06-14",
                "end_date": "2025-06-18",
                "flow_intensity": "light",
                "notes": "Lighter than usual"
            },
            {
                "start_date": "2025-07-11",
                "end_date": "2025-07-16",
                "flow_intensity": "medium",
                "notes": "Current cycle"
            }
        ]
        
        created_periods = []
        for period_data in test_periods:
            period = self.create_test_period(**period_data)
            if period:
                created_periods.append(period)
            else:
                return False
        
        # Test 2: Get all periods
        self.log("Testing GET /api/periods...")
        try:
            response = self.session.get(f"{self.base_url}/periods")
            if response.status_code == 200:
                periods = response.json()
                self.log(f"✅ Retrieved {len(periods)} periods")
                
                # Verify our created periods are in the response
                created_ids = set(self.created_period_ids)
                retrieved_ids = set(p["id"] for p in periods)
                if created_ids.issubset(retrieved_ids):
                    self.log("✅ All created periods found in GET response")
                else:
                    self.log("❌ Some created periods missing from GET response", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get periods: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error getting periods: {str(e)}", "ERROR")
            return False
        
        # Test 3: Update a period
        if created_periods:
            self.log("Testing PUT /api/periods/{id}...")
            period_to_update = created_periods[0]
            update_data = {
                "flow_intensity": "heavy",
                "notes": "Updated notes - flow was heavier than expected"
            }
            
            try:
                response = self.session.put(
                    f"{self.base_url}/periods/{period_to_update['id']}", 
                    json=update_data
                )
                if response.status_code == 200:
                    updated_period = response.json()
                    if (updated_period["flow_intensity"] == "heavy" and 
                        "Updated notes" in updated_period["notes"]):
                        self.log("✅ Period updated successfully")
                    else:
                        self.log("❌ Period update data incorrect", "ERROR")
                        return False
                else:
                    self.log(f"❌ Failed to update period: {response.status_code}", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Error updating period: {str(e)}", "ERROR")
                return False
        
        # Test 4: Delete a period
        if created_periods and len(created_periods) > 1:
            self.log("Testing DELETE /api/periods/{id}...")
            period_to_delete = created_periods[-1]  # Delete the last one
            
            try:
                response = self.session.delete(f"{self.base_url}/periods/{period_to_delete['id']}")
                if response.status_code == 200:
                    self.log("✅ Period deleted successfully")
                    self.created_period_ids.remove(period_to_delete['id'])
                    
                    # Verify it's actually deleted
                    response = self.session.get(f"{self.base_url}/periods")
                    if response.status_code == 200:
                        periods = response.json()
                        deleted_ids = [p["id"] for p in periods if p["id"] == period_to_delete['id']]
                        if not deleted_ids:
                            self.log("✅ Period deletion verified")
                        else:
                            self.log("❌ Period still exists after deletion", "ERROR")
                            return False
                else:
                    self.log(f"❌ Failed to delete period: {response.status_code}", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Error deleting period: {str(e)}", "ERROR")
                return False
        
        # Test 5: Test error handling - try to update non-existent period
        self.log("Testing error handling for non-existent period...")
        try:
            response = self.session.put(
                f"{self.base_url}/periods/non-existent-id", 
                json={"notes": "This should fail"}
            )
            if response.status_code == 404:
                self.log("✅ Proper 404 error for non-existent period")
            else:
                self.log(f"❌ Expected 404, got {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error testing non-existent period: {str(e)}", "ERROR")
            return False
        
        return True
    
    def test_cycle_predictions(self) -> bool:
        """Test cycle prediction algorithm"""
        self.log("\n=== Testing Cycle Predictions ===")
        
        try:
            response = self.session.get(f"{self.base_url}/cycle-predictions")
            if response.status_code == 200:
                predictions = response.json()
                self.log("✅ Cycle predictions retrieved successfully")
                
                # Verify prediction structure
                expected_fields = [
                    "next_period_start", "next_period_end", "next_ovulation",
                    "next_fertile_start", "next_fertile_end", 
                    "average_cycle_length", "cycle_regularity"
                ]
                
                for field in expected_fields:
                    if field not in predictions:
                        self.log(f"❌ Missing field in predictions: {field}", "ERROR")
                        return False
                
                self.log("✅ All required prediction fields present")
                
                # Verify prediction logic with our test data
                if predictions["average_cycle_length"]:
                    avg_cycle = predictions["average_cycle_length"]
                    self.log(f"✅ Average cycle length calculated: {avg_cycle} days")
                    
                    # Our test periods have cycles of ~28-30 days, so average should be reasonable
                    if 25 <= avg_cycle <= 35:
                        self.log("✅ Average cycle length is realistic")
                    else:
                        self.log(f"❌ Average cycle length seems unrealistic: {avg_cycle}", "ERROR")
                        return False
                
                if predictions["cycle_regularity"]:
                    regularity = predictions["cycle_regularity"]
                    self.log(f"✅ Cycle regularity assessed: {regularity}")
                    
                    valid_regularity = ["Regular", "Somewhat Regular", "Irregular", "Not enough data"]
                    if regularity in valid_regularity:
                        self.log("✅ Cycle regularity value is valid")
                    else:
                        self.log(f"❌ Invalid cycle regularity: {regularity}", "ERROR")
                        return False
                
                if predictions["next_period_start"]:
                    next_period = predictions["next_period_start"]
                    self.log(f"✅ Next period predicted: {next_period}")
                    
                    # Verify it's a future date
                    try:
                        next_date = datetime.strptime(next_period, "%Y-%m-%d").date()
                        if next_date > date.today():
                            self.log("✅ Next period prediction is in the future")
                        else:
                            self.log("❌ Next period prediction is not in the future", "ERROR")
                            return False
                    except ValueError:
                        self.log(f"❌ Invalid date format for next period: {next_period}", "ERROR")
                        return False
                
                return True
            else:
                self.log(f"❌ Failed to get cycle predictions: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error getting cycle predictions: {str(e)}", "ERROR")
            return False
    
    def test_calendar_data(self) -> bool:
        """Test calendar data endpoint"""
        self.log("\n=== Testing Calendar Data ===")
        
        # Test current month and a month with our test data
        test_months = [
            (2025, 1),  # Month with our test data
            (2025, 3)   # Future month
        ]
        
        for year, month in test_months:
            self.log(f"Testing calendar data for {year}-{month:02d}...")
            
            try:
                response = self.session.get(f"{self.base_url}/calendar/{year}/{month}")
                if response.status_code == 200:
                    calendar_data = response.json()
                    self.log(f"✅ Calendar data retrieved for {year}-{month:02d}")
                    
                    # Verify response structure
                    required_fields = ["calendar_data", "predictions", "month", "year"]
                    for field in required_fields:
                        if field not in calendar_data:
                            self.log(f"❌ Missing field in calendar response: {field}", "ERROR")
                            return False
                    
                    # Verify month and year match request
                    if calendar_data["month"] != month or calendar_data["year"] != year:
                        self.log(f"❌ Calendar month/year mismatch", "ERROR")
                        return False
                    
                    # Verify calendar_data structure
                    days = calendar_data["calendar_data"]
                    if not isinstance(days, list) or len(days) == 0:
                        self.log(f"❌ Calendar data should be non-empty list", "ERROR")
                        return False
                    
                    # Check first day structure
                    first_day = days[0]
                    day_fields = ["date", "phase", "is_period", "is_predicted_period", 
                                "is_ovulation", "is_fertile", "flow_intensity", "notes"]
                    
                    for field in day_fields:
                        if field not in first_day:
                            self.log(f"❌ Missing field in day data: {field}", "ERROR")
                            return False
                    
                    self.log(f"✅ Calendar data structure is correct ({len(days)} days)")
                    
                    # For January 2025, verify we have period data
                    if year == 2025 and month == 1:
                        period_days = [day for day in days if day["is_period"]]
                        if period_days:
                            self.log(f"✅ Found {len(period_days)} period days in January 2025")
                            
                            # Verify flow intensity is set for period days
                            for day in period_days:
                                if day["flow_intensity"]:
                                    self.log(f"✅ Flow intensity set for period day: {day['date']}")
                                    break
                        else:
                            self.log("❌ No period days found in January 2025 (expected from test data)", "ERROR")
                            return False
                    
                    # Verify phase information
                    phases_found = set(day["phase"] for day in days if day["phase"])
                    valid_phases = {"menstrual", "follicular", "ovulation", "luteal"}
                    if phases_found.issubset(valid_phases):
                        self.log(f"✅ Valid cycle phases found: {phases_found}")
                    else:
                        invalid_phases = phases_found - valid_phases
                        self.log(f"❌ Invalid phases found: {invalid_phases}", "ERROR")
                        return False
                    
                else:
                    self.log(f"❌ Failed to get calendar data: {response.status_code}", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Error getting calendar data: {str(e)}", "ERROR")
                return False
        
        return True
    
    def test_edge_cases(self) -> bool:
        """Test edge cases and error handling"""
        self.log("\n=== Testing Edge Cases ===")
        
        # Test 1: Invalid date format
        self.log("Testing invalid date format...")
        try:
            invalid_period = {
                "start_date": "invalid-date",
                "flow_intensity": "medium"
            }
            response = self.session.post(f"{self.base_url}/periods", json=invalid_period)
            if response.status_code in [400, 422]:  # Bad request or validation error
                self.log("✅ Proper error handling for invalid date format")
            else:
                self.log(f"❌ Expected 400/422 for invalid date, got {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error testing invalid date: {str(e)}", "ERROR")
            return False
        
        # Test 2: Invalid flow intensity
        self.log("Testing invalid flow intensity...")
        try:
            invalid_period = {
                "start_date": "2024-05-01",
                "flow_intensity": "invalid_intensity"
            }
            response = self.session.post(f"{self.base_url}/periods", json=invalid_period)
            if response.status_code in [400, 422]:
                self.log("✅ Proper error handling for invalid flow intensity")
            else:
                self.log(f"❌ Expected 400/422 for invalid flow intensity, got {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error testing invalid flow intensity: {str(e)}", "ERROR")
            return False
        
        # Test 3: Invalid calendar month/year
        self.log("Testing invalid calendar parameters...")
        try:
            response = self.session.get(f"{self.base_url}/calendar/2025/13")  # Invalid month
            if response.status_code in [400, 422]:
                self.log("✅ Proper error handling for invalid month")
            else:
                self.log(f"❌ Expected 400/422 for invalid month, got {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error testing invalid calendar params: {str(e)}", "ERROR")
            return False
        
        return True
    
    def cleanup(self):
        """Clean up test data"""
        self.log("\n=== Cleaning Up Test Data ===")
        
        for period_id in self.created_period_ids:
            try:
                response = self.session.delete(f"{self.base_url}/periods/{period_id}")
                if response.status_code == 200:
                    self.log(f"✅ Cleaned up period: {period_id}")
                else:
                    self.log(f"⚠️ Failed to cleanup period {period_id}: {response.status_code}", "WARN")
            except Exception as e:
                self.log(f"⚠️ Error cleaning up period {period_id}: {str(e)}", "WARN")
        
        self.created_period_ids.clear()
    
    def run_all_tests(self) -> bool:
        """Run all backend API tests"""
        self.log("🚀 Starting Menstrual Cycle Tracker Backend API Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        try:
            # Test API connection
            if not self.test_api_connection():
                return False
            
            # Test Period CRUD operations
            if not self.test_period_crud_operations():
                return False
            
            # Test cycle predictions
            if not self.test_cycle_predictions():
                return False
            
            # Test calendar data
            if not self.test_calendar_data():
                return False
            
            # Test edge cases
            if not self.test_edge_cases():
                return False
            
            self.log("\n🎉 All backend API tests passed successfully!")
            return True
            
        except Exception as e:
            self.log(f"❌ Unexpected error during testing: {str(e)}", "ERROR")
            return False
        finally:
            # Always cleanup
            self.cleanup()

def main():
    """Main test execution"""
    tester = MenstrualCycleAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ BACKEND TESTS: ALL PASSED")
        sys.exit(0)
    else:
        print("\n❌ BACKEND TESTS: SOME FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()