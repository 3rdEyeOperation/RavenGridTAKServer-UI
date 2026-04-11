# Video Recording Retention Cleanup

Automated cleanup scripts for deleting old video recordings based on retention policy.

## Overview

These scripts will automatically delete video recordings older than the specified retention period:
- Deletes video files from filesystem
- Deletes thumbnails
- Removes database records from PostgreSQL
- **Does NOT modify OpenTAKServer code**

## Files

- `cleanup_old_videos.py` - Python cleanup script (Linux/Windows)
- `cleanup_old_videos.ps1` - PowerShell cleanup script (Windows alternative)
- `setup_linux_cron.sh` - Linux cron job setup script
- `setup_windows_task.ps1` - Windows Scheduled Task setup script
- `README.md` - This file

---

## Quick Start

### Linux Setup

1. **Configure database credentials:**
   ```bash
   cd retener
   chmod +x setup_linux_cron.sh
   ./setup_linux_cron.sh
   ```

2. **Edit `.env` file** with your database credentials:
   ```bash
   nano .env
   ```
   ```env
   VIDEO_RETENTION_DAYS=30
   DB_HOST=localhost
   DB_NAME=opentakserver
   DB_USER=postgres
   DB_PASS=your_password_here
   DB_PORT=5432
   ```

3. **Install cron job:**
   ```bash
   (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/run_cleanup.sh >> /var/log/video_retention_cleanup.log 2>&1") | crontab -
   ```

4. **Test manually:**
   ```bash
   ./run_cleanup.sh
   ```

### Windows Setup

1. **Run PowerShell as Administrator**

2. **Setup scheduled task:**
   ```powershell
   cd retener
   .\setup_windows_task.ps1 -RetentionDays 30 -DbHost "localhost" -DbName "opentakserver" -DbUser "postgres" -DbPassword "yourpassword"
   ```

3. **Set environment variables** (if not using parameters):
   ```powershell
   $env:VIDEO_RETENTION_DAYS = 30
   $env:DB_HOST = "localhost"
   $env:DB_NAME = "opentakserver"
   $env:DB_USER = "postgres"
   $env:DB_PASS = "yourpassword"
   ```

4. **Test manually:**
   ```powershell
   python cleanup_old_videos.py
   ```

---

## Configuration

### Retention Policy

Set `VIDEO_RETENTION_DAYS` to control how long recordings are kept:

| Value | Behavior |
|-------|----------|
| `0` | **Unlimited** - Never delete automatically |
| `7` | Keep recordings for 7 days |
| `30` | Keep recordings for 30 days (default) |
| `90` | Keep recordings for 90 days |

### Database Connection

Configure these environment variables:

```bash
DB_HOST=localhost       # PostgreSQL host
DB_NAME=opentakserver   # Database name
DB_USER=postgres        # Database user
DB_PASS=your_password   # Database password
DB_PORT=5432           # PostgreSQL port
```

---

## Schedule Options

### Linux Cron Examples

```bash
# Daily at 2 AM
0 2 * * * /path/to/run_cleanup.sh >> /var/log/video_cleanup.log 2>&1

# Every 12 hours
0 */12 * * * /path/to/run_cleanup.sh >> /var/log/video_cleanup.log 2>&1

# Weekly on Sunday at 3 AM
0 3 * * 0 /path/to/run_cleanup.sh >> /var/log/video_cleanup.log 2>&1
```

### Windows Task Scheduler Examples

```powershell
# Daily at 2 AM (default)
.\setup_windows_task.ps1 -RunTime "02:00"

# Daily at midnight
.\setup_windows_task.ps1 -RunTime "00:00"

# Twice daily (create two tasks)
.\setup_windows_task.ps1 -RunTime "02:00"
.\setup_windows_task.ps1 -TaskName "VideoCleanup_Evening" -RunTime "14:00"
```

---

## Manual Execution

### Python Script

```bash
# Linux
export VIDEO_RETENTION_DAYS=30
export DB_HOST=localhost
export DB_NAME=opentakserver
export DB_USER=postgres
export DB_PASS=yourpassword
python3 cleanup_old_videos.py

# Windows
$env:VIDEO_RETENTION_DAYS=30
python cleanup_old_videos.py
```

### PowerShell Script

```powershell
.\cleanup_old_videos.ps1 -RetentionDays 30 -DbHost "localhost" -DbName "opentakserver" -DbUser "postgres" -DbPassword "yourpass"
```

---

## Requirements

### Python Script
- Python 3.6+
- `psycopg2` package: `pip install psycopg2-binary`

### PowerShell Script
- PowerShell 5.1+ (Windows)
- Npgsql .NET driver: `Install-Package Npgsql`

---

## Monitoring

### Check Logs

**Linux:**
```bash
tail -f /var/log/video_retention_cleanup.log
```

**Windows:**
```powershell
Get-Content .\retener\cleanup.log -Tail 20 -Wait
```

### Verify Cron Job (Linux)

```bash
crontab -l
```

### Verify Scheduled Task (Windows)

```powershell
Get-ScheduledTask -TaskName "VideoRetentionCleanup"
Start-ScheduledTask -TaskName "VideoRetentionCleanup"  # Run manually
```

---

## Troubleshooting

### Script doesn't delete anything
- Check `VIDEO_RETENTION_DAYS` is not 0
- Verify database connection settings
- Check if recordings exist older than retention period
- Run manually to see output

### Database connection errors
- Verify PostgreSQL is running
- Check database credentials
- Ensure user has DELETE permissions on `video_recording` table
- Check firewall/network access

### File permission errors
- Ensure script user has read/write access to video storage directory
- Check file ownership
- Run with appropriate permissions (may need sudo/admin)

### Cron job not running
- Check cron service is running: `systemctl status cron`
- Verify crontab syntax: `crontab -l`
- Check system logs: `grep CRON /var/log/syslog`

---

## Security Notes

- **Never commit `.env` file** with passwords to version control
- Use environment variables for sensitive data
- Restrict file permissions on scripts and config files
- Run with minimum required privileges
- Consider using PostgreSQL connection file (`.pgpass`) for credentials

---

## Integration with OpenTAKServer UI

The **Video Recordings** page in the UI provides:
- ✅ Manual delete button for individual recordings
- ✅ Filter recordings by camera/path
- ✅ Download recordings
- ✅ View/play recordings

This retention script complements the UI by providing **automatic cleanup** without modifying OpenTAKServer backend code.

---

## Uninstall

### Linux
```bash
crontab -e  # Remove the cleanup job line
rm -rf retener/
```

### Windows
```powershell
Unregister-ScheduledTask -TaskName "VideoRetentionCleanup" -Confirm:$false
Remove-Item -Recurse retener/
```

---

## Support

For issues related to:
- **UI features**: Check OpenTAKServer-UI repository
- **Database schema**: Check OpenTAKServer repository
- **This script**: Create issue in this repository

---

## License

Same as OpenTAKServer project
