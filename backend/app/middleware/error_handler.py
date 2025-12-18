"""
Error handling middleware for the FastAPI application
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import traceback
import logging

logger = logging.getLogger(__name__)


async def error_handler_middleware(request: Request, call_next):
    """
    Global error handler middleware
    Catches all exceptions and returns a consistent error response
    """
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        # Log the error
        logger.error(f"Error processing request {request.method} {request.url}")
        logger.error(f"Error: {str(exc)}")
        logger.error(traceback.format_exc())
        
        # Return a generic error response
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred",
                "error": str(exc),
                "path": str(request.url.path)
            }
        )

