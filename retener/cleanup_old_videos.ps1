# PowerShell Video Recording Cleanup Script
# Deletes video recordings older than the specified retention period

param(
    [int]$RetentionDays = 30,
    [string]$DbHost = "localhost",
    [string]$DbName = "opentakserver",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "",
    [int]$DbPort = 5432
)

# Check if PostgreSQL module is available
if (-not (Get-Module -ListAvailable -Name "Npgsql")) {
    Write-Warning "PostgreSQL .NET driver not found. Install with: Install-Package Npgsql"
    exit 1
}

function Cleanup-OldRecordings {
    if ($RetentionDays -le 0) {
        Write-Host "Retention disabled (unlimited storage)"
        return
    }

    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    Write-Host "[$(Get-Date)] Deleting recordings older than: $cutoffDate"

    try {
        # Connection string
        $connectionString = "Host=$DbHost;Port=$DbPort;Database=$DbName;Username=$DbUser;Password=$DbPassword"
        
        # Connect to database (using ADO.NET SqlClient pattern)
        Add-Type -Path "path\to\Npgsql.dll"  # Adjust path as needed
        $conn = New-Object Npgsql.NpgsqlConnection($connectionString)
        $conn.Open()

        # Query old recordings
        $query = @"
SELECT id, filename, thumbnail 
FROM video_recording 
WHERE stop_time < @cutoffDate AND in_progress = false
"@

        $cmd = $conn.CreateCommand()
        $cmd.CommandText = $query
        $cmd.Parameters.AddWithValue("cutoffDate", $cutoffDate) | Out-Null
        
        $reader = $cmd.ExecuteReader()
        $recordings = @()
        
        while ($reader.Read()) {
            $recordings += @{
                id = $reader["id"]
                filename = $reader["filename"]
                thumbnail = $reader["thumbnail"]
            }
        }
        $reader.Close()

        $deletedCount = 0
        $fileDeleteErrors = 0

        foreach ($rec in $recordings) {
            # Delete video file
            if ($rec.filename -and (Test-Path $rec.filename)) {
                try {
                    Remove-Item $rec.filename -Force
                    Write-Host "  ✓ Deleted: $($rec.filename)"
                } catch {
                    Write-Host "  ✗ Error deleting $($rec.filename): $_"
                    $fileDeleteErrors++
                }
            }

            # Delete thumbnail
            if ($rec.thumbnail -and (Test-Path $rec.thumbnail)) {
                try {
                    Remove-Item $rec.thumbnail -Force
                } catch {
                    Write-Host "  ✗ Error deleting thumbnail: $_"
                }
            }

            # Delete from database
            $deleteCmd = $conn.CreateCommand()
            $deleteCmd.CommandText = "DELETE FROM video_recording WHERE id = @id"
            $deleteCmd.Parameters.AddWithValue("id", $rec.id) | Out-Null
            $deleteCmd.ExecuteNonQuery() | Out-Null
            $deletedCount++
        }

        $conn.Close()

        Write-Host "[$(Get-Date)] Complete: Deleted $deletedCount recordings older than $RetentionDays days"
        if ($fileDeleteErrors -gt 0) {
            Write-Warning "$fileDeleteErrors file deletion errors occurred"
        }

    } catch {
        Write-Error "Error: $_"
        exit 1
    }
}

Cleanup-OldRecordings
