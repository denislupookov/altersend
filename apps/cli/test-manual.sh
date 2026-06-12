#!/bin/bash
# Manual test script for CLI edge cases that can't be tested in automation.
# Usage: bash apps/cli/test-manual.sh
#
# Prerequisites:
#   - Build CLI first: npm run cli:build
#   - PowerShell: .\apps\cli\test-manual.ps1

set -e

CLI="node apps/cli/dist/index.js"
TEST_DIR=$(mktemp -d)
SENDER_STORAGE="$TEST_DIR/sender"
RECEIVER_STORAGE="$TEST_DIR/receiver"
DOWNLOAD_DIR="$TEST_DIR/downloads"

cleanup() {
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

echo "=== Manual CLI Test Suite ==="
echo "Temp dir: $TEST_DIR"
echo ""

# --- Test 1: QR code in real terminal ---
echo "--- Test 1: QR code display ---"
echo "Run this in a REAL terminal (not piped):"
echo "  $CLI send --qr $TEST_DIR/any-file.txt"
echo "You should see a QR code printed in the terminal."
echo ""

# --- Test 2: Large file transfer ---
echo "--- Test 2: Large file (50MB) ---"
echo "Creating 50MB test file..."
dd if=/dev/urandom of="$TEST_DIR/large.bin" bs=1M count=50 2>/dev/null

echo "Starting sender (50MB)..."
$CLI send --no-updates --storage "$SENDER_STORAGE" "$TEST_DIR/large.bin" &
SENDER_PID=$!
sleep 3

# Extract join code from sender output
JOIN_CODE=$(cat /proc/$SENDER_PID/fd/1 2>/dev/null || echo "")
# Fallback: just read from the terminal output
echo "Sender started with PID $SENDER_PID"
echo "Copy the join code from the sender output above, then run:"
echo "  $CLI receive --no-updates --storage \"$RECEIVER_STORAGE\" <join-code> --output \"$DOWNLOAD_DIR\""
echo ""
echo "After transfer, verify file integrity:"
echo "  md5sum $TEST_DIR/large.bin $DOWNLOAD_DIR/large.bin"
echo ""
echo "Press Enter when done testing large file..."
read -r
kill $SENDER_PID 2>/dev/null || true

# --- Test 3: Cancel mid-transfer ---
echo "--- Test 3: Cancel mid-transfer ---"
echo "Run these in two terminals:"
echo ""
echo "Terminal 1 (sender):"
echo "  $CLI send --no-updates --storage \"$SENDER_STORAGE\" \"$TEST_DIR/large.bin\""
echo ""
echo "Terminal 2 (receiver, start immediately after sender prints join code):"
echo "  $CLI receive --no-updates --storage \"$RECEIVER_STORAGE\" <join-code> --output \"$DOWNLOAD_DIR\""
echo ""
echo "Then in Terminal 3 (cancel):"
echo "  $CLI cancel --no-updates --storage \"$RECEIVER_STORAGE\""
echo ""
echo "Press Enter when done testing cancel..."
read -r

# --- Test 4: Status command ---
echo "--- Test 4: Status command ---"
echo "Run while a transfer is active:"
echo "  $CLI status --no-updates --storage \"$RECEIVER_STORAGE\""
echo ""

# --- Test 5: Multi-file with mixed sizes ---
echo "--- Test 5: Multi-file transfer ---"
dd if=/dev/urandom of="$TEST_DIR/100kb.bin" bs=1K count=100 2>/dev/null
dd if=/dev/urandom of="$TEST_DIR/1mb.bin" bs=1M count=1 2>/dev/null
echo "Starting multi-file sender..."
$CLI send --no-updates --storage "$SENDER_STORAGE" "$TEST_DIR/100kb.bin" "$TEST_DIR/1mb.bin" "$TEST_DIR/large.bin" &
SENDER_PID=$!
sleep 3
echo "Sender started. Run receiver in another terminal:"
echo "  $CLI receive --no-updates --storage \"$RECEIVER_STORAGE\" <join-code> --output \"$DOWNLOAD_DIR\""
echo ""
echo "Press Enter when done testing multi-file..."
read -r
kill $SENDER_PID 2>/dev/null || true

echo "=== All manual tests complete ==="
