"""ASGI compatibility module.

Allows both:
- uvicorn main:app
- uvicorn app.main:app
"""

from main import app

__all__ = ["app"]
