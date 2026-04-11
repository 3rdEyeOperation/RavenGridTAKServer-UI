#!/bin/bash
# Setup script for Linux cron job

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEANUP_SCRIPT="$SCRIPT_DIR/cleanup_old_videos.py"
LOG_FILE="/var/log/video_retention_cleanup.log"

echo "Setting up video retention cleanup cron job..."

# Make Python script executable
chmod +x "$CLEANUP_SCRIPT"

# Create environment file
cat > "$SCRIPT_DIR/.env" << EOF
# Video Retention Configuration
VIDEO_RETENTION_DAYS=30
DB_HOST=localhost
DB_NAME=opentakserver
DB_USER=postgres
DB_PASS=your_password_here
DB_PORT=5432
EOF

echo "Created .env file at $SCRIPT_DIR/.env"
echo "Please edit .env to set your database credentials"

# Create wrapper script that loads environment variables
cat > "$SCRIPT_DIR/run_cleanup.sh" << 'EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(cat "$SCRIPT_DIR/.env" | grep -v '^#' | xargs)
fi

# Run cleanup script
python3 "$SCRIPT_DIR/cleanup_old_videos.py"
EOF

chmod +x "$SCRIPT_DIR/run_cleanup.sh"

# Add to crontab (runs daily at 2 AM)
CRON_ENTRY="0 2 * * * $SCRIPT_DIR/run_cleanup.sh >> $LOG_FILE 2>&1"

echo ""
echo "To install the cron job, run:"
echo "  (crontab -l 2>/dev/null; echo '$CRON_ENTRY') | crontab -"
echo ""
echo "Or manually add this line to crontab (crontab -e):"
echo "  $CRON_ENTRY"
echo ""
echo "Log file: $LOG_FILE"
echo ""
echo "Done! Don't forget to edit $SCRIPT_DIR/.env with your database credentials"
