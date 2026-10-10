"""
WeCare.AI Backend Application Package
"""
from app.main import app
from app.config import settings, get_settings

__all__ = ["app", "settings", "get_settings"]