"""
Logging middleware for the FastAPI application
Logs all API requests to MongoDB
"""
from fastapi import Request
from datetime import datetime
import time
import logging

logger = logging.getLogger(__name__)


async def logging_middleware(request: Request, call_next):
    """
    Logs all API requests and responses
    """
    # Start time
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    try:
        # Process the request
        response = await call_next(request)
        
        # Calculate process time
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            f"Response: {request.method} {request.url.path} "
            f"Status: {response.status_code} "
            f"Time: {process_time:.3f}s"
        )
        
        # Optional: Log to MongoDB
        try:
            from app.database.mongodb_connection import logs_collection
            
            log_entry = {
                "timestamp": datetime.now(),
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "status_code": response.status_code,
                "process_time": process_time,
                "client_host": request.client.host if request.client else None
            }
            
            # Insert log asynchronously (non-blocking)
            logs_collection.insert_one(log_entry)
        except Exception as e:
            logger.warning(f"Failed to log to MongoDB: {str(e)}")
        
        return response
        
    except Exception as exc:
        # Log error
        process_time = time.time() - start_time
        logger.error(
            f"Error: {request.method} {request.url.path} "
            f"Error: {str(exc)} "
            f"Time: {process_time:.3f}s"
        )
        raise

