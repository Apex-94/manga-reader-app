from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from typing import Optional

class SchedulerService:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
    
    def start(self):
        self.scheduler.start()
    
    def shutdown(self):
        self.scheduler.shutdown()
    
    def add_daily_job(self, func, hour: int, minute: int, job_id: str, **kwargs):
        """Add a daily recurring job"""
        trigger = CronTrigger(hour=hour, minute=minute)
        return self.scheduler.add_job(
            func,
            trigger=trigger,
            id=job_id,
            **kwargs
        )
    
    def add_interval_job(self, func, minutes: int, job_id: str, **kwargs):
        """Add an interval-based job (runs every X minutes)"""
        trigger = IntervalTrigger(minutes=minutes)
        return self.scheduler.add_job(
            func,
            trigger=trigger,
            id=job_id,
            **kwargs
        )
    
    def remove_job(self, job_id: str):
        """Remove a scheduled job by ID"""
        self.scheduler.remove_job(job_id)
    
    def get_job(self, job_id: str):
        """Get a job by ID"""
        return self.scheduler.get_job(job_id)
    
    def get_all_jobs(self):
        """Get all scheduled jobs"""
        return self.scheduler.get_jobs()

# Create a singleton instance
scheduler_service = SchedulerService()
