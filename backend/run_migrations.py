#!/usr/bin/env python3
"""
Database migration script for the Manga Reader application.
This script can be run manually to initialize the database and migrate data.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.migrations import main

if __name__ == "__main__":
    main()
