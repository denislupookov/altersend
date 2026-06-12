# Manual test script for CLI edge cases.
# Usage: .\apps\cli\test-manual.ps1
#
# Prerequisites:
#   1. npm run cli:build (from repo root)
#   2. .\apps\cli\setup-test-files.ps1 (creates 1GB test file)
#
# IMPORTANT: For tests requiring 2 terminals, open them SIDE BY SIDE
# so you can see both at once.

$CLI = "node apps/cli/dist/index.js"
$SMALL = "$env:TEMP\test.txt"
$LARGE = "$env:TEMP\large-file.bin"

Write-Host "=== Manual CLI Tests ===" -ForegroundColor Cyan

if (-not (Test-Path $SMALL)) {
    Write-Host "Missing $SMALL - run: .\apps\cli\setup-test-files.ps1" -ForegroundColor Red
    Write-Host "Also run: npm run cli:build" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $LARGE)) {
    Write-Host "Missing $LARGE - run: .\apps\cli\setup-test-files.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "Test files:" -ForegroundColor Cyan
Write-Host "  Small:  $SMALL ($([Math]::Round((Get-Item $SMALL).Length)) bytes)"
Write-Host "  Large:  $LARGE ($([Math]::Round((Get-Item $LARGE).Length / 1GB, 2)) GB)"
Write-Host ""

# ============================================
# TEST 1: Ctrl+C before any transfer
# ============================================
Write-Host "=== TEST 1: Cancel BEFORE transfer starts ===" -ForegroundColor Yellow
Write-Host "Run in terminal 1:" -ForegroundColor Green
Write-Host "  $CLI send --qr --no-updates $SMALL"
Write-Host "  OR (no QR): $CLI send --no-updates $SMALL"
Write-Host ""
Write-Host "Expected: 'Transfer cancelled.' (NOT 'Transfer complete!')" -ForegroundColor Cyan
Write-Host "Action: Press Ctrl+C immediately after seeing the join code/QR."
Write-Host ""
Read-Host "Press Enter when ready for next test"

# ============================================
# TEST 2: Normal transfer (progress bar)
# ============================================
Write-Host "=== TEST 2: Normal transfer with progress bar ===" -ForegroundColor Yellow
Write-Host "OPEN 2 TERMINALS SIDE BY SIDE"
Write-Host ""
Write-Host "Terminal 1 (sender):" -ForegroundColor Green
Write-Host "  $CLI send --no-updates $LARGE"
Write-Host ""
Write-Host "Terminal 2 (receiver) - START IMMEDIATELY AFTER:" -ForegroundColor Green
Write-Host "  $CLI receive --no-updates `<join-code`> --output `"$env:TEMP\cli-receive`""
Write-Host ""
Write-Host "Expected:" -ForegroundColor Cyan
Write-Host "  - Progress bar on BOTH terminals, updating in-place (single line)"
Write-Host "  - Both auto-exit when done - NO Ctrl+C needed"
Write-Host "  - Sender: 'Transfer complete!'"
Write-Host "  - Receiver: 'Transfer complete!'"
Write-Host ""
Read-Host "Press Enter when ready for next test"

# ============================================
# TEST 3: Cancel sender mid-transfer
# ============================================
Write-Host "=== TEST 3: Cancel SENDER mid-transfer ===" -ForegroundColor Yellow
Write-Host "OPEN 2 TERMINALS SIDE BY SIDE"
Write-Host ""
Write-Host "Terminal 1 (sender):" -ForegroundColor Green
Write-Host "  $CLI send --no-updates $LARGE"
Write-Host ""
Write-Host "Terminal 2 (receiver) - START IMMEDIATELY:" -ForegroundColor Green
Write-Host "  $CLI receive --no-updates `<join-code`> --output `"$env:TEMP\cli-receive`""
Write-Host ""
Write-Host "Action: While transfer is in progress, press Ctrl+C on TERMINAL 1."
Write-Host "Expected:" -ForegroundColor Cyan
Write-Host "  - Sender: 'Transfer cancelled.' (NOT 'Transfer complete!')"
Write-Host "  - Receiver: continues downloading, eventually 'Transfer complete!'"
Write-Host ""
Read-Host "Press Enter when ready for next test"

# ============================================
# TEST 4: Cancel receiver mid-download
# ============================================
Write-Host "=== TEST 4: Cancel RECEIVER mid-download ===" -ForegroundColor Yellow
Write-Host "OPEN 2 TERMINALS SIDE BY SIDE"
Write-Host ""
Write-Host "Terminal 1 (sender):" -ForegroundColor Green
Write-Host "  $CLI send --no-updates $LARGE"
Write-Host ""
Write-Host "Terminal 2 (receiver) - START IMMEDIATELY:" -ForegroundColor Green
Write-Host "  $CLI receive --no-updates `<join-code`> --output `"$env:TEMP\cli-receive`""
Write-Host ""
Write-Host "Action: While downloading, press Ctrl+C on TERMINAL 2."
Write-Host "Expected: Receiver shows 'Transfer cancelled.'" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter when ready for next test"

# ============================================
# TEST 5: Disconnect command
# ============================================
Write-Host "=== TEST 5: Disconnect command ===" -ForegroundColor Yellow
Write-Host "OPEN 2 TERMINALS SIDE BY SIDE"
Write-Host ""
Write-Host "Terminal 1 (sender):" -ForegroundColor Green
Write-Host "  $CLI send --no-updates $SMALL"
Write-Host ""
Write-Host "Terminal 2 (receiver) - START IMMEDIATELY:" -ForegroundColor Green
Write-Host "  $CLI receive --no-updates `<join-code`> --output `"$env:TEMP\cli-receive`""
Write-Host ""
Write-Host "After transfer starts, open Terminal 3 and run:" -ForegroundColor Green
Write-Host "  $CLI disconnect --no-updates"
Write-Host ""
Write-Host "Expected: Both sender and receiver show 'Peer disconnected'" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter when ready for next test"

# ============================================
# TEST 6: QR code display
# ============================================
Write-Host "=== TEST 6: QR code display ===" -ForegroundColor Yellow
Write-Host "IMPORTANT: Run this in a REAL terminal (cmd.exe or PowerShell.exe)" -ForegroundColor Magenta
Write-Host "Running in VS Code / this pane may NOT show the QR code properly."
Write-Host ""
Write-Host "Open a new terminal and run:" -ForegroundColor Green
Write-Host "  $CLI send --qr --no-updates $SMALL"
Write-Host ""
Write-Host "Expected: QR code rendered in ASCII art" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter when ready for next test"

# ============================================
# TEST 7: --temp flag deletes source file
# ============================================
Write-Host "=== TEST 7: --temp deletes source file ===" -ForegroundColor Yellow
Write-Host "OPEN 2 TERMINALS SIDE BY SIDE"
Write-Host ""
Write-Host "First, re-create the small test file:" -ForegroundColor Magenta
Write-Host "  `"AlterSend CLI test file`" | Out-File -FilePath $SMALL -Encoding ASCII"
Write-Host ""
Write-Host "Terminal 1 (sender with --temp):" -ForegroundColor Green
Write-Host "  $CLI send --temp --no-updates $SMALL"
Write-Host ""
Write-Host "Terminal 2 (receiver) - START IMMEDIATELY:" -ForegroundColor Green
Write-Host "  $CLI receive --no-updates `<join-code`> --output `"$env:TEMP\cli-receive`""
Write-Host ""
Write-Host "Expected:" -ForegroundColor Cyan
Write-Host "  - Transfer completes"
Write-Host "  - $SMALL is DELETED (use Test-Path to verify)"
Write-Host ""
Read-Host "Press Enter when ready for next test"

Write-Host ""
Write-Host "=== All manual tests done ===" -ForegroundColor Cyan