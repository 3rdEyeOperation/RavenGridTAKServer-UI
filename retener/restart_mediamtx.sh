#!/bin/bash
# MediaMTX Path Cleanup Script
# Restarts MediaMTX to clear stale video streaming paths
# 
# Issue: When EUDs disconnect or recordings are deleted, MediaMTX retains
# paths in memory causing "path already exists" errors on reconnection
#
# Usage: 
#   Manual: sudo ./restart_mediamtx.sh
#   Cron:   */30 * * * * /path/to/restart_mediamtx.sh

echo "[$(date)] Restarting MediaMTX to clear stale paths..."

# Check if MediaMTX is running
if systemctl is-active --quiet mediamtx; then
    echo "MediaMTX is running, restarting..."
    systemctl restart mediamtx
    
    # Wait for MediaMTX to fully restart
    sleep 3
    
    # Verify MediaMTX started successfully
    if systemctl is-active --quiet mediamtx; then
        echo "[$(date)] MediaMTX restarted successfully"
        
        # Optional: Restart OpenTAKServer to re-establish connections
        # Uncomment if needed
        # systemctl restart opentakserver
        # echo "[$(date)] OpenTAKServer restarted"
    else
        echo "[$(date)] ERROR: MediaMTX failed to restart"
        exit 1
    fi
else
    echo "MediaMTX is not running, starting..."
    systemctl start mediamtx
    echo "[$(date)] MediaMTX started"
fi

echo "[$(date)] Path cleanup complete"
