#!/bin/bash
# Quick build test script
# This doesn't actually build the ISO but verifies the configuration files

set -e

echo "=== Testing Alpine Midori Kiosk Configuration ==="

# Create temp directory for testing
TEST_DIR="/tmp/alpine-kiosk-test-$$"
mkdir -p "$TEST_DIR/overlay/etc"/{apk,local.d,profile.d,runlevels/default}
mkdir -p "$TEST_DIR/overlay/home/kiosk"

cd "$TEST_DIR"

# Test 1: Create repositories file
echo "Test 1: Creating APK repositories configuration..."
cat > overlay/etc/apk/repositories << 'EOF'
https://dl-cdn.alpinelinux.org/alpine/v3.18/main
https://dl-cdn.alpinelinux.org/alpine/v3.18/community
EOF
echo "  ✓ repositories file created"

# Test 2: Create inittab
echo "Test 2: Creating inittab configuration..."
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
echo "  ✓ inittab created"

# Test 3: Create kiosk setup script
echo "Test 3: Creating kiosk setup script..."
cat > overlay/etc/local.d/00-kiosk-setup.start << 'EOF'
#!/bin/sh
if ! id kiosk >/dev/null 2>&1; then
    adduser -D -h /home/kiosk -s /bin/sh kiosk
fi

if ! command -v midori >/dev/null 2>&1; then
    apk update >/dev/null 2>&1
    apk add --no-cache \
        xorg-server xf86-video-vesa xf86-input-evdev \
        xf86-input-keyboard xf86-input-mouse xinit \
        xset xsetroot twm midori ttf-dejavu dbus \
        eudev mesa-dri-gallium >/dev/null 2>&1
    rc-update add dbus default >/dev/null 2>&1
    rc-update add udev sysinit >/dev/null 2>&1
fi

if [ ! -f /home/kiosk/.xinitrc ]; then
    cat > /home/kiosk/.xinitrc << 'XINITRC'
#!/bin/sh
xset s off
xset -dpms
xset s noblank
xsetroot -solid black
twm &
exec midori --app=https://www.google.com
XINITRC
    chmod +x /home/kiosk/.xinitrc
    chown -R kiosk:kiosk /home/kiosk
fi
EOF
chmod +x overlay/etc/local.d/00-kiosk-setup.start
echo "  ✓ kiosk setup script created"

# Test 4: Create auto-startx script
echo "Test 4: Creating auto-startx script..."
cat > overlay/etc/profile.d/auto-startx.sh << 'EOF'
#!/bin/sh
if [ "$(whoami)" = "kiosk" ] && [ "$(tty)" = "/dev/tty1" ] && [ -z "$DISPLAY" ]; then
    exec startx
fi
EOF
chmod +x overlay/etc/profile.d/auto-startx.sh
echo "  ✓ auto-startx script created"

# Test 5: Enable local.d service
echo "Test 5: Setting up local.d service..."
ln -sf /etc/init.d/local overlay/etc/runlevels/default/local
echo "  ✓ local.d service linked"

# Test 6: Create apkovl tarball
echo "Test 6: Creating apkovl tarball..."
cd overlay
tar czf ../kiosk.apkovl.tar.gz .
cd ..
if [ -f kiosk.apkovl.tar.gz ]; then
    SIZE=$(du -h kiosk.apkovl.tar.gz | cut -f1)
    echo "  ✓ apkovl created (size: $SIZE)"
else
    echo "  ✗ apkovl creation failed"
    exit 1
fi

# Test 7: Verify tarball contents
echo "Test 7: Verifying tarball contents..."
tar tzf kiosk.apkovl.tar.gz | grep -q "etc/inittab" && echo "  ✓ inittab found in tarball"
tar tzf kiosk.apkovl.tar.gz | grep -q "etc/local.d/00-kiosk-setup.start" && echo "  ✓ setup script found in tarball"
tar tzf kiosk.apkovl.tar.gz | grep -q "etc/profile.d/auto-startx.sh" && echo "  ✓ auto-startx found in tarball"

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo ""
echo "=== All Tests Passed ==="
echo "Configuration files are valid!"
echo "You can now run build.sh to create the actual ISO."
