# Setup Windows Scheduled Task for Video Retention Cleanup
# Run as Administrator

param(
    [int]$RetentionDays = 30,
    [string]$RunTime = "02:00",  # 2 AM
    [string]$DbHost = "localhost",
    [string]$DbName = "opentakserver",
    [string]$DbUser = "postgres",
    [string]$DbPassword = ""
)

$ScriptPath = Join-Path $PSScriptRoot "cleanup_old_videos.py"
$LogPath = Join-Path $PSScriptRoot "cleanup.log"
$TaskName = "VideoRetentionCleanup"

Write-Host "Setting up Windows Scheduled Task: $TaskName"

# Check if Python is available
try {
    $pythonPath = (Get-Command python).Source
    Write-Host "Python found at: $pythonPath"
} catch {
    Write-Error "Python not found in PATH. Please install Python first."
    exit 1
}

# Create environment variables for the task
$env:VIDEO_RETENTION_DAYS = $RetentionDays
$env:DB_HOST = $DbHost
$env:DB_NAME = $DbName
$env:DB_USER = $DbUser
$env:DB_PASS = $DbPassword

# Create the scheduled task action
$action = New-ScheduledTaskAction `
    -Execute $pythonPath `
    -Argument "`"$ScriptPath`"" `
    -WorkingDirectory $PSScriptRoot

# Create the trigger (daily at specified time)
$trigger = New-ScheduledTaskTrigger `
    -Daily `
    -At $RunTime

# Create task settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable

# Create the principal (run with highest privileges)
$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Register the scheduled task
try {
    # Remove existing task if it exists
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    
    # Register new task
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Automatically delete video recordings older than $RetentionDays days"
    
    Write-Host "`nScheduled Task created successfully!" -ForegroundColor Green
    Write-Host "Task Name: $TaskName"
    Write-Host "Schedule: Daily at $RunTime"
    Write-Host "Retention: $RetentionDays days"
    Write-Host "Script: $ScriptPath"
    Write-Host "`nTo view/manage the task, run: Get-ScheduledTask -TaskName '$TaskName'"
    Write-Host "To run manually: Start-ScheduledTask -TaskName '$TaskName'"
    
} catch {
    Write-Error "Failed to create scheduled task: $_"
    exit 1
}

# Save configuration file
$configPath = Join-Path $PSScriptRoot "config.json"
@{
    VideoRetentionDays = $RetentionDays
    DbHost = $DbHost
    DbName = $DbName
    DbUser = $DbUser
    RunTime = $RunTime
    LogPath = $LogPath
} | ConvertTo-Json | Out-File $configPath

Write-Host "`nConfiguration saved to: $configPath"
Write-Host "`nIMPORTANT: Set environment variables for the task:"
Write-Host "  VIDEO_RETENTION_DAYS=$RetentionDays"
Write-Host "  DB_HOST=$DbHost"
Write-Host "  DB_NAME=$DbName"
Write-Host "  DB_USER=$DbUser"
Write-Host "  DB_PASS=<your_password>"
