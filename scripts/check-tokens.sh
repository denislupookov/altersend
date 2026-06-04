
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Pattern: any #-prefixed 3/4/6/8-digit hex, OR rgb(/rgba( call.
PATTERN='#[0-9a-fA-F]{3,8}\b|rgba?\('

# Search apps/** and packages/components/**.
matches=$(grep -rEn "$PATTERN" apps packages/components \
  --include='*.ts' \
  --include='*.tsx' \
  --include='*.css' \
  2>/dev/null \
  | grep -vE '(node_modules|/dist/|\.bundle\.js)' \
  | grep -vE '(packages/components/src/theme/tokens\.json|packages/components/src/theme/tokens\.raw\.ts|packages/components/src/theme/tokens\.css(\.native)?\.ts|packages/components/src/theme/themes/|packages/components/src/theme/tailwind-theme\.css|packages/components/scripts/generate-tokens\.mjs|packages/components/src/theme/fileTypeColors\.ts|packages/components/src/theme/withAlpha\.ts)' \
  | grep -vE '(transparent|currentColor|inherit|absoluteFillObject)' \
  | grep -vE 'packages/components/src/components/SendFileListRow/styles\.ts:[0-9]+:\s+thumb(Image|Video|Pdf|Audio|Archive|App|Code|Generic):' \
  || true)

if [ -n "$matches" ]; then
  echo "✗ Color literals found outside the token system:"
  echo
  echo "$matches"
  echo
  echo "Use tokens from @altersend/components/theme instead."
  echo "  - Web (Tailwind): bg-success/12, border-info, etc."
  echo "  - StyleX (css.create): tokens.colorXxx"
  echo "  - RN inline: theme.colors.colorXxx — and withAlpha(color, alpha) for opacity"
  exit 1
fi

echo "✓ No color literals outside the token system"
