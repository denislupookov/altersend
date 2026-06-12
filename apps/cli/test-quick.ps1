# Quick automated tests for things we can test without multiple terminals.
# Usage: .\apps\cli\test-quick.ps1

$CLI = "node apps/cli/dist/index.js"
$TEST_DIR = "$env:TEMP\altersend-quick-test"
$SENDER_STORAGE = "$TEST_DIR\sender"
$RECEIVER_STORAGE = "$TEST_DIR\receiver"
$DOWNLOAD_DIR = "$TEST_DIR\downloads"

if (Test-Path $TEST_DIR) { Remove-Item $TEST_DIR -Recurse -Force }
New-Item -ItemType Directory -Path $TEST_DIR -Force | Out-Null
New-Item -ItemType Directory -Path $SENDER_STORAGE -Force | Out-Null
New-Item -ItemType Directory -Path $RECEIVER_STORAGE -Force | Out-Null
New-Item -ItemType Directory -Path $DOWNLOAD_DIR -Force | Out-Null

$passed = 0
$failed = 0

function Test-Case($name, $script) {
    Write-Host "  $name" -NoNewline
    try {
        $result = & $script
        if ($result) { Write-Host " PASS" -ForegroundColor Green; $script:passed++ }
        else { Write-Host " FAIL" -ForegroundColor Red; $script:failed++ }
    } catch {
        Write-Host " FAIL ($($_.Exception.Message))" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "=== Quick Automated Tests ===" -ForegroundColor Cyan
Write-Host ""

# --- Error handling ---
Write-Host "Error handling:" -ForegroundColor Yellow
Test-Case "send with no files" { & { $out = & node apps/cli/dist/index.js send 2>&1; $LASTEXITCODE -eq 2 } }
Test-Case "send with nonexistent file" { & { $out = & node apps/cli/dist/index.js send "C:\nonexistent.txt" 2>&1; $LASTEXITCODE -eq 2 } }
Test-Case "receive with no join code" { & { $out = & node apps/cli/dist/index.js receive 2>&1; $LASTEXITCODE -eq 2 } }
Test-Case "peek with no join code" { & { $out = & node apps/cli/dist/index.js peek 2>&1; $LASTEXITCODE -eq 2 } }
Test-Case "receive with bad join code" { & { $out = & node apps/cli/dist/index.js receive "xyz" 2>&1; $LASTEXITCODE -eq 2 } }
Test-Case "peek with bad join code" { & { $out = & node apps/cli/dist/index.js peek "xyz" 2>&1; $LASTEXITCODE -eq 2 } }
Write-Host ""

# --- Help output ---
Write-Host "Help output:" -ForegroundColor Yellow
Test-Case "main --help" { & { $out = & node apps/cli/dist/index.js --help 2>&1; $out -match "send" -and $out -match "receive" } }
Test-Case "send --help shows --qr" { & { $out = & node apps/cli/dist/index.js send --help 2>&1; $out -match "--qr" } }
Test-Case "send --help shows --temp" { & { $out = & node apps/cli/dist/index.js send --help 2>&1; $out -match "--temp" } }
Test-Case "send --help shows --no-updates" { & { $out = & node apps/cli/dist/index.js send --help 2>&1; $out -match "--no-updates" } }
Test-Case "receive --help shows --output" { & { $out = & node apps/cli/dist/index.js receive --help 2>&1; $out -match "--output" } }
Write-Host ""

# --- check-update / update ---
Write-Host "Update commands:" -ForegroundColor Yellow
Test-Case "check-update exits cleanly" { & { $out = & node apps/cli/dist/index.js check-update 2>&1; $LASTEXITCODE -eq 0 } }
Test-Case "check-update --no-updates exits cleanly" { & { $out = & node apps/cli/dist/index.js check-update --no-updates 2>&1; $LASTEXITCODE -eq 0 } }
Test-Case "update exits cleanly" { & { $out = & node apps/cli/dist/index.js update 2>&1; $LASTEXITCODE -eq 0 } }
Write-Host ""

# --- Large file create/verify ---
Write-Host "File operations:" -ForegroundColor Yellow
Test-Case "create 10MB file" {
    $bytes = New-Object byte[] (10 * 1024 * 1024)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    [System.IO.File]::WriteAllBytes("$TEST_DIR\10mb.bin", $bytes)
    (Get-Item "$TEST_DIR\10mb.bin").Length -eq 10 * 1024 * 1024
}
Test-Case "create empty file" {
    [System.IO.File]::WriteAllBytes("$TEST_DIR\empty.txt", [byte[]]@())
    (Get-Item "$TEST_DIR\empty.txt").Length -eq 0
}
Write-Host ""

# --- Summary ---
Write-Host "=== Results ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

# Cleanup
Remove-Item $TEST_DIR -Recurse -Force -ErrorAction SilentlyContinue
