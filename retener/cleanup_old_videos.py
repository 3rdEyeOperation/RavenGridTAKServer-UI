#!/usr/bin/env python3
"""
Video Recording Retention Cleanup Script
Deletes video recordings older than the specified retention period
"""
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
import psycopg2

# Configuration
RETENTION_DAYS = int(os.getenv('VIDEO_RETENTION_DAYS', 30))  # 0 = unlimited
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'opentakserver')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', '')
DB_PORT = int(os.getenv('DB_PORT', 5432))

def cleanup_old_recordings():
    """Delete video recordings older than retention period"""
    if RETENTION_DAYS <= 0:
        print("Retention disabled (unlimited storage)")
        return
    
    cutoff_date = datetime.now() - timedelta(days=RETENTION_DAYS)
    print(f"[{datetime.now()}] Deleting recordings older than: {cutoff_date}")
    
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        # Get old recordings
        cur.execute("""
            SELECT id, filename, thumbnail 
            FROM video_recording 
            WHERE stop_time < %s AND in_progress = false
        """, (cutoff_date,))
        
        recordings = cur.fetchall()
        deleted_count = 0
        file_delete_errors = 0
        
        for rec_id, filename, thumbnail in recordings:
            # Delete video file
            if filename and os.path.exists(filename):
                try:
                    os.remove(filename)
                    print(f"  ✓ Deleted: {filename}")
                except Exception as e:
                    print(f"  ✗ Error deleting {filename}: {e}")
                    file_delete_errors += 1
            
            # Delete thumbnail
            if thumbnail and os.path.exists(thumbnail):
                try:
                    os.remove(thumbnail)
                except Exception as e:
                    print(f"  ✗ Error deleting thumbnail: {e}")
            
            # Delete from database
            cur.execute("DELETE FROM video_recording WHERE id = %s", (rec_id,))
            deleted_count += 1
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"[{datetime.now()}] Complete: Deleted {deleted_count} recordings older than {RETENTION_DAYS} days")
        if file_delete_errors > 0:
            print(f"  Warning: {file_delete_errors} file deletion errors occurred")
        
        return deleted_count
        
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    cleanup_old_recordings()
