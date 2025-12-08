#!/bin/bash
# Validation script for Alpine Midori Kiosk ISO
# This script validates that the ISO was built correctly

set -e

ISO_FILE="alpine-midori-kiosk.iso"
MIN_SIZE_MB=150
MAX_SIZE_MB=250
REQUIRED_FILES=(
    "boot/vmlinuz-lts"
    "boot/initramfs-lts"
    "boot/syslinux/syslinux.cfg"
    "kiosk.apkovl.tar.gz"
)

echo "=== Alpine Midori Kiosk ISO Validation ==="
echo ""

# Check if ISO exists
if [ ! -f "$ISO_FILE" ]; then
    echo "❌ Error: $ISO_FILE not found!"
    echo "   Run ./build.sh first to create the ISO."
    exit 1
fi

echo "✓ ISO file exists: $ISO_FILE"

# Check ISO size
ISO_SIZE=$(du -m "$ISO_FILE" | cut -f1)
if [ "$ISO_SIZE" -lt "$MIN_SIZE_MB" ] || [ "$ISO_SIZE" -gt "$MAX_SIZE_MB" ]; then
    echo "⚠️  Warning: ISO size is $ISO_SIZE MB (expected $MIN_SIZE_MB-$MAX_SIZE_MB MB)"
else
    echo "✓ ISO size is reasonable: $ISO_SIZE MB"
fi

# Check if xorriso is available
if ! command -v xorriso &> /dev/null; then
    echo "⚠️  xorriso not found - skipping detailed ISO validation"
    echo "   Install with: sudo apt-get install xorriso"
    exit 0
fi

# Create temp directory for validation
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Extract ISO file list
echo ""
echo "Checking ISO contents..."
xorriso -indev "$ISO_FILE" -find 2>/dev/null > "$TEMP_DIR/filelist.txt"

# Check for required files
MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if grep -q "./$file" "$TEMP_DIR/filelist.txt"; then
        echo "✓ Found: $file"
    else
        echo "❌ Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo ""
    echo "❌ Validation failed: $MISSING_FILES required files missing"
    exit 1
fi

# Extract and validate syslinux.cfg
echo ""
echo "Validating boot configuration..."
xorriso -osirrox on -indev "$ISO_FILE" -extract boot/syslinux/syslinux.cfg "$TEMP_DIR/syslinux.cfg" 2>/dev/null

if grep -q "apkovl=/kiosk.apkovl.tar.gz" "$TEMP_DIR/syslinux.cfg"; then
    echo "✓ Boot configuration includes kiosk overlay"
else
    echo "❌ Boot configuration missing kiosk overlay"
    exit 1
fi

if grep -q "TIMEOUT 10" "$TEMP_DIR/syslinux.cfg"; then
    echo "✓ Boot timeout set correctly (10 deciseconds = 1 second)"
else
    echo "⚠️  Boot timeout not set to 10"
fi

if grep -q "DEFAULT kiosk" "$TEMP_DIR/syslinux.cfg"; then
    echo "✓ Default boot entry is 'kiosk'"
else
    echo "❌ Default boot entry is not 'kiosk'"
    exit 1
fi

# Extract and validate apkovl
echo ""
echo "Validating configuration overlay..."
xorriso -osirrox on -indev "$ISO_FILE" -extract kiosk.apkovl.tar.gz "$TEMP_DIR/kiosk.apkovl.tar.gz" 2>/dev/null

cd "$TEMP_DIR"
mkdir apkovl
cd apkovl
tar xzf ../kiosk.apkovl.tar.gz 2>/dev/null

APKOVL_FILES=(
    "etc/inittab"
    "etc/local.d/00-kiosk-setup.start"
    "etc/profile.d/auto-startx.sh"
    "etc/apk/repositories"
    "etc/runlevels/default/local"
)

MISSING_APKOVL=0
for file in "${APKOVL_FILES[@]}"; do
    if [ -f "$file" ] || [ -L "$file" ]; then
        echo "✓ Found in overlay: $file"
    else
        echo "❌ Missing from overlay: $file"
        MISSING_APKOVL=$((MISSING_APKOVL + 1))
    fi
done

if [ $MISSING_APKOVL -gt 0 ]; then
    echo ""
    echo "❌ Validation failed: $MISSING_APKOVL overlay files missing"
    exit 1
fi

# Validate inittab
if grep -q "tty1::respawn:/bin/login -f kiosk" etc/inittab; then
    echo "✓ Auto-login configured in inittab"
else
    echo "❌ Auto-login not configured correctly"
    exit 1
fi

# Validate setup script
if grep -q "midori" etc/local.d/00-kiosk-setup.start; then
    echo "✓ Midori installation in setup script"
else
    echo "❌ Midori not in setup script"
    exit 1
fi

if grep -q "xorg-server" etc/local.d/00-kiosk-setup.start; then
    echo "✓ X11 installation in setup script"
else
    echo "❌ X11 not in setup script"
    exit 1
fi

# Validate auto-startx
if grep -q "startx" etc/profile.d/auto-startx.sh; then
    echo "✓ Auto-startx configured"
else
    echo "❌ Auto-startx not configured"
    exit 1
fi

# Validate repositories
if grep -q "alpine/v3.18/main" etc/apk/repositories; then
    echo "✓ Alpine repositories configured"
else
    echo "❌ Alpine repositories not configured"
    exit 1
fi

echo ""
echo "=== Validation Summary ==="
echo "✓ All validation checks passed!"
echo ""
echo "ISO is ready to use with v86."
echo ""
echo "Next steps:"
echo "  1. Load $ISO_FILE in v86 emulator"
echo "  2. Configure with at least 256MB RAM (512MB recommended)"
echo "  3. First boot will take 60-120 seconds (package installation)"
echo "  4. Subsequent boots take 20-40 seconds"
echo ""
echo "For testing locally with QEMU:"
echo "  qemu-system-x86_64 -cdrom $ISO_FILE -m 512M"
