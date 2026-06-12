# Setup test files for CLI manual testing.
# Run this once before test-manual.ps1
# Usage: .\apps\cli\setup-test-files.ps1

Write-Host "Creating test files in `$env:TEMP..." -ForegroundColor Cyan

# Small test file
$smallPath = "$env:TEMP\test.txt"
"AlterSend CLI test file. Testing 1 2 3." | Out-File -FilePath $smallPath -Encoding ASCII
Write-Host "  Created: $smallPath ($((Get-Item $smallPath).Length) bytes)" -ForegroundColor Green

# Large file (1GB) using sparse file for speed
$largePath = "$env:TEMP\large-file.bin"
if (Test-Path $largePath) { Remove-Item $largePath -Force }

# Use fsutil to create a 1GB sparse file (instant)
$sizeBytes = 1GB
$sizeStr = "1GB"
$null = fsutil file createnew $largePath $sizeBytes 2>$null

if ((Test-Path $largePath) -and ((Get-Item $largePath).Length -eq $sizeBytes)) {
    Write-Host "  Created: $largePath ($sizeStr sparse file)" -ForegroundColor Green
    Write-Host "  Note: Sparse file - actual disk usage is minimal until data is written" -ForegroundColor Yellow
} else {
    # Fallback: create with random data if sparse fails
    Write-Host "  Sparse file creation failed, creating with random data (slower)..." -ForegroundColor Yellow
    $bytes = New-Object byte[] (1GB)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    [System.IO.File]::WriteAllBytes($largePath, $bytes)
    Write-Host "  Created: $largePath ($sizeStr)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Test files ready. Run: .\apps\cli\test-manual.ps1" -ForegroundColor Cyan