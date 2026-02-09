from fastapi import APIRouter, HTTPException
from app.scheduler import scheduler_service

router = APIRouter(tags=["scheduler"])

@router.get("/jobs")
async def get_all_jobs():
    """Get all scheduled jobs"""
    jobs = scheduler_service.get_all_jobs()
    return {
        "jobs": [
            {
                "id": job.id,
                "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger),
                "func": str(job.func),
            }
            for job in jobs
        ]
    }

@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get a specific job by ID"""
    job = scheduler_service.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "id": job.id,
        "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
        "trigger": str(job.trigger),
        "func": str(job.func),
    }

@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job by ID"""
    try:
        scheduler_service.remove_job(job_id)
        return {"message": "Job deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Job not found")
