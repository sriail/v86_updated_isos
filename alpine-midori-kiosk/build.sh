#!/bin/bash
set -e

# Alpine Linux Midori Kiosk ISO Builder
# Optimized for v86 emulator
# Creates a minimal Alpine Linux that boots directly into Midori browser

ALPINE_VERSION="3.18"
ALPINE_RELEASE="3.18.6"
ISO_NAME="alpine-midori-kiosk.iso"
WORK_DIR="$(pwd)/build"
OUTPUT_DIR="$(pwd)"

echo "=== Alpine Linux Midori Kiosk ISO Builder ==="
echo "Alpine version: ${ALPINE_VERSION}"
echo "Output: ${ISO_NAME}"
echo ""

# Clean previous build
if [ -d "$WORK_DIR" ]; then
    echo "Cleaning previous build..."
    rm -rf "$WORK_DIR"
fi

# Create working directories
echo "Creating working directories..."
mkdir -p "$WORK_DIR"/{iso-source,overlay}
cd "$WORK_DIR"

# Download Alpine Linux standard ISO
ALPINE_ISO="alpine-standard-${ALPINE_RELEASE}-x86_64.iso"
ALPINE_URL="https://dl-cdn.alpinelinux.org/alpine/v${ALPINE_VERSION}/releases/x86_64/${ALPINE_ISO}"

if [ ! -f "$ALPINE_ISO" ]; then
    echo "Downloading Alpine Linux base ISO..."
    wget -q --show-progress "$ALPINE_URL" -O "$ALPINE_ISO" || {
        echo "Error: Failed to download Alpine ISO"
        exit 1
    }
fi

echo "Extracting base ISO..."
# Check if we need sudo for mounting
if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
else
    SUDO=""
fi

# Extract ISO contents
mkdir -p iso-mount
$SUDO mount -o loop "$ALPINE_ISO" iso-mount 2>/dev/null || {
    echo "Error: Failed to mount ISO. You may need to run this script with sudo."
    exit 1
}
cp -a iso-mount/* iso-source/
$SUDO umount iso-mount
rmdir iso-mount

# Make ISO files writable
chmod -R u+w iso-source/

echo "Creating kiosk configuration overlay..."

# Create overlay directory structure
mkdir -p overlay/etc/{apk,local.d,profile.d,runlevels/default}
mkdir -p overlay/home/kiosk

# Configure APK repositories
cat > overlay/etc/apk/repositories << 'EOF'
https://dl-cdn.alpinelinux.org/alpine/v3.18/main
https://dl-cdn.alpinelinux.org/alpine/v3.18/community
EOF

# Create auto-login configuration
cat > overlay/etc/inittab << 'EOF'
::sysinit:/sbin/openrc sysinit
::sysinit:/sbin/openrc boot
::wait:/sbin/openrc default

# Auto-login on tty1 as kiosk user
tty1::respawn:/bin/login -f kiosk
tty2::askfirst:/bin/login

::ctrlaltdel:/sbin/reboot
::shutdown:/sbin/openrc shutdown
EOF

# Create kiosk setup script (runs on boot)
cat > overlay/etc/local.d/00-kiosk-setup.start << 'EOF'
#!/bin/sh
# Kiosk system setup script

# Create kiosk user if it doesn't exist
if ! id kiosk >/dev/null 2>&1; then
    adduser -D -h /home/kiosk -s /bin/sh kiosk
fi

# Install required packages if not already installed
if ! command -v midori >/dev/null 2>&1; then
    echo "Installing kiosk packages..."
    apk update >/dev/null 2>&1
    apk add --no-cache \
        xorg-server \
        xf86-video-vesa \
        xf86-input-evdev \
        xf86-input-keyboard \
        xf86-input-mouse \
        xinit \
        xset \
        xsetroot \
        twm \
        midori \
        ttf-dejavu \
        dbus \
        eudev \
        mesa-dri-gallium >/dev/null 2>&1
    
    # Enable required services
    rc-update add dbus default >/dev/null 2>&1
    rc-update add udev sysinit >/dev/null 2>&1
fi

# Create .xinitrc for kiosk user
if [ ! -f /home/kiosk/.xinitrc ]; then
    cat > /home/kiosk/.xinitrc << 'XINITRC'
#!/bin/sh
# Disable screen blanking and power management
xset s off
xset -dpms
xset s noblank

# Set black background
xsetroot -solid black

# Start minimal window manager in background
twm &

# Launch Midori in fullscreen kiosk mode
exec midori --app=https://www.google.com
XINITRC
    chmod +x /home/kiosk/.xinitrc
    chown -R kiosk:kiosk /home/kiosk
fi
EOF
chmod +x overlay/etc/local.d/00-kiosk-setup.start

# Enable local.d service
ln -sf /etc/init.d/local overlay/etc/runlevels/default/local

# Auto-start X for kiosk user
cat > overlay/etc/profile.d/auto-startx.sh << 'EOF'
#!/bin/sh
# Auto-start X11 for kiosk user on tty1
if [ "$(whoami)" = "kiosk" ] && [ "$(tty)" = "/dev/tty1" ] && [ -z "$DISPLAY" ]; then
    exec startx
fi
EOF
chmod +x overlay/etc/profile.d/auto-startx.sh

# Create apkovl (Alpine Package Overlay) tarball
echo "Creating configuration tarball..."
cd overlay
tar czf ../kiosk.apkovl.tar.gz .
cd ..

# Copy overlay to ISO
cp kiosk.apkovl.tar.gz iso-source/

# Configure boot parameters
echo "Configuring boot loader..."

# Update syslinux configuration for faster boot
cat > iso-source/boot/syslinux/syslinux.cfg << 'EOF'
TIMEOUT 10
PROMPT 0
DEFAULT kiosk

LABEL kiosk
  MENU LABEL Alpine Linux Midori Kiosk
  KERNEL /boot/vmlinuz-lts
  APPEND initrd=/boot/initramfs-lts modules=loop,squashfs,sd-mod,usb-storage quiet console=tty1 apkovl=/kiosk.apkovl.tar.gz
EOF

# Create the bootable ISO
echo "Creating bootable ISO..."

# Check for required tools
if ! command -v xorriso &> /dev/null && ! command -v genisoimage &> /dev/null; then
    echo "Error: Neither xorriso nor genisoimage found."
    echo "Install with: apt-get install xorriso (or genisoimage)"
    exit 1
fi

cd iso-source

if command -v xorriso &> /dev/null; then
    xorriso -as mkisofs \
        -o "$OUTPUT_DIR/$ISO_NAME" \
        -V "Alpine Kiosk" \
        -c boot/syslinux/boot.cat \
        -b boot/syslinux/isolinux.bin \
        -no-emul-boot \
        -boot-load-size 4 \
        -boot-info-table \
        -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin \
        . 2>/dev/null || \
    xorriso -as mkisofs \
        -o "$OUTPUT_DIR/$ISO_NAME" \
        -V "Alpine Kiosk" \
        -c boot/syslinux/boot.cat \
        -b boot/syslinux/isolinux.bin \
        -no-emul-boot \
        -boot-load-size 4 \
        -boot-info-table \
        .
else
    genisoimage -o "$OUTPUT_DIR/$ISO_NAME" \
        -V "Alpine Kiosk" \
        -J -R -l \
        -b boot/syslinux/isolinux.bin \
        -c boot/syslinux/boot.cat \
        -no-emul-boot \
        -boot-load-size 4 \
        -boot-info-table \
        .
fi

cd "$OUTPUT_DIR"

# Verify ISO was created
if [ -f "$ISO_NAME" ]; then
    echo ""
    echo "=== Build Complete ==="
    echo "ISO: $ISO_NAME"
    echo "Size: $(du -h "$ISO_NAME" | cut -f1)"
    echo ""
    echo "Usage with v86:"
    echo "  1. Load $ISO_NAME in v86 emulator"
    echo "  2. System will auto-boot (10 second timeout)"
    echo "  3. Auto-login as kiosk user"
    echo "  4. Midori browser launches in fullscreen"
    echo ""
    echo "Note: First boot downloads packages from Alpine repos"
    echo "      Subsequent boots are faster"
else
    echo "Error: ISO creation failed"
    exit 1
fi
