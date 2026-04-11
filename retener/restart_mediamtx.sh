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

LOG_FILE="/var/log/mediamtx_restart.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========== MediaMTX Restart Script Started =========="

# Check if MediaMTX service exists
if ! systemctl list-unit-files | grep -q "mediamtx.service"; then
    log "ERROR: MediaMTX service not found. Is MediaMTX installed?"
    log "Install with: sudo apt install mediamtx  OR  check installation"
    exit 1
fi

# Check current MediaMTX status
if systemctl is-active --quiet mediamtx; then
    log "MediaMTX is running, restarting to clear stale paths..."
    systemctl restart mediamtx
    
    # Wait for MediaMTX to fully restart
    sleep 5
    
    # Verify MediaMTX started successfully
    if systemctl is-active --quiet mediamtx; then
        log "SUCCESS: MediaMTX restarted successfully"
        
        # Check if port 9997 is listening
        if ss -tlnp | grep -q ":9997"; then
            log "SUCCESS: MediaMTX API listening on port 9997"
        else
            log "WARNING: MediaMTX running but port 9997 not listening"
            log "Check MediaMTX config: /etc/mediamtx/mediamtx.yml"
        fi
    else
        log "ERROR: MediaMTX failed to restart"
        log "Last 20 lines of MediaMTX logs:"
        journalctl -u mediamtx -n 20 --no-pager | tee -a "$LOG_FILE"
        exit 1
    fi
else
    log "WARNING: MediaMTX is NOT running, attempting to start..."
    systemctl start mediamtx
    sleep 5
    
    if systemctl is-active --quiet mediamtx; then
        log "SUCCESS: MediaMTX started"
    else
        log "ERROR: MediaMTX failed to start"
        log "MediaMTX status:"
        systemctl status mediamtx --no-pager | tee -a "$LOG_FILE"
        log "Last 20 lines of MediaMTX logs:"
        journalctl -u mediamtx -n 20 --no-pager | tee -a "$LOG_FILE"
        exit 1
    fi
fi

log "========== MediaMTX Restart Complete =========="
