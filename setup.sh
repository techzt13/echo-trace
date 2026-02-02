#!/bin/bash
# Setup script for EchoTrace extension
# Converts SVG icons to PNG format

echo "EchoTrace Setup Script"
echo "====================="

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Installing ImageMagick for SVG to PNG conversion..."
    apt-get update
    apt-get install -y imagemagick
fi

echo "Converting SVG icons to PNG..."

# Convert SVG icons to PNG
convert -background none icons/icon16.svg -resize 16x16 icons/icon16.png
convert -background none icons/icon48.svg -resize 48x48 icons/icon48.png
convert -background none icons/icon128.svg -resize 128x128 icons/icon128.png

echo "✓ Icons converted successfully"
echo ""
echo "Next steps to load the extension:"
echo "1. Open Chrome and navigate to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select this directory (/workspaces/echo-trace)"
echo ""
echo "To view the dashboard:"
echo "1. Open a new tab to see the custom new tab page"
echo "2. Use the popup icon to toggle tracking and see quick stats"
echo ""
echo "Testing:"
echo "- Enable tracking from the popup"
echo "- Browse a few websites"
echo "- Check the new tab dashboard to see stats"
echo "- Wait for the 5-10 minute alarm to update stats (configurable)"
echo ""
echo "Privacy:"
echo "- All data is stored locally in chrome.storage.local"
echo "- No external telemetry or API calls"
echo "- You can export your data as JSON anytime"
