# Alpine Linux Midori Kiosk - Technical Documentation

## Overview

This ISO creates a minimal Linux system that boots directly into the Midori web browser in fullscreen kiosk mode. It's optimized for the v86 emulator.

## Architecture

### Components

1. **Base System**: Alpine Linux 3.18 (minimal Linux distribution)
2. **Display Server**: X.Org with VESA driver (universal compatibility)
3. **Window Manager**: TWM (Tiny Window Manager - ~100KB)
4. **Browser**: Midori (lightweight WebKit-based browser)
5. **Init System**: OpenRC (Alpine's default)

### Boot Process

1. **BIOS/UEFI Boot**: Loads SYSLINUX bootloader
2. **Kernel Load**: Linux kernel with minimal modules
3. **Init System**: OpenRC starts system services
4. **Auto-login**: Login process auto-authenticates as `kiosk` user
5. **X11 Start**: `.profile` triggers `startx` on tty1
6. **Browser Launch**: `.xinitrc` launches Midori in fullscreen

### Configuration Files

#### `/etc/inittab`
Configures the init system to auto-login the kiosk user on tty1:
```
tty1::respawn:/bin/login -f kiosk
```

#### `/etc/profile.d/auto-startx.sh`
Automatically starts X11 when kiosk user logs in on tty1:
```sh
if [ "$(whoami)" = "kiosk" ] && [ "$(tty)" = "/dev/tty1" ] && [ -z "$DISPLAY" ]; then
    exec startx
fi
```

#### `/home/kiosk/.xinitrc`
X11 startup script that launches the browser:
```sh
xset s off -dpms s noblank  # Disable power management
xsetroot -solid black        # Black background
twm &                        # Start window manager
exec midori --app=URL        # Launch browser
```

#### `/etc/local.d/00-kiosk-setup.start`
First-boot setup script that:
- Creates kiosk user
- Installs required packages from Alpine repos
- Enables necessary services
- Sets up configuration files

## Optimization for v86

### Size Optimization
- Uses Alpine Linux (5-10x smaller than Ubuntu/Debian)
- Minimal package set (no unnecessary utilities)
- VESA graphics driver (no 3D acceleration overhead)
- TWM instead of heavy desktop environments

### Performance Optimization
- No desktop environment overhead
- Direct boot to browser (no intermediate steps)
- Minimal services running
- Optimized boot parameters (quiet, minimal logging)

### Compatibility
- VESA driver works in all emulators
- No proprietary drivers required
- Standard keyboard/mouse input
- Universal networking support

## Package List

### Essential Packages
- `xorg-server` - X11 display server
- `xf86-video-vesa` - Universal graphics driver
- `xf86-input-evdev` - Generic input driver
- `xf86-input-keyboard` - Keyboard support
- `xf86-input-mouse` - Mouse support
- `xinit` - X11 initialization
- `xset` - X11 preferences utility
- `xsetroot` - X11 root window utility
- `twm` - Tiny Window Manager
- `midori` - Web browser
- `ttf-dejavu` - Font support
- `dbus` - Inter-process communication
- `eudev` - Device manager
- `mesa-dri-gallium` - Software rendering

Total installed size: ~150-200 MB

## Customization

### Change Default URL
Edit the `.xinitrc` file in the overlay:
```sh
exec midori --app=https://your-url-here.com
```

### Change Browser
Replace Midori with another browser:
```sh
# For Firefox:
apk add firefox-esr
exec firefox --kiosk https://example.com

# For Chromium:
apk add chromium
exec chromium --kiosk --no-sandbox https://example.com
```

### Add Additional Software
Edit `00-kiosk-setup.start` and add packages to the `apk add` line:
```sh
apk add --no-cache \
    xorg-server \
    ... \
    your-package-here
```

### Disable Auto-login
Remove or comment out the auto-login line in `/etc/inittab`:
```
# tty1::respawn:/bin/login -f kiosk
tty1::respawn:/sbin/getty 38400 tty1
```

## Build Requirements

### System Requirements
- Linux system (Ubuntu, Debian, Fedora, etc.)
- 2GB free disk space
- Internet connection (to download Alpine ISO)
- Root/sudo access (for mounting ISO)

### Required Tools
- `wget` - Download Alpine ISO
- `mount/umount` - Extract ISO contents
- `tar` - Create configuration overlay
- `xorriso` or `genisoimage` - Create bootable ISO

Install on Ubuntu/Debian:
```bash
sudo apt-get install wget xorriso
```

Install on Fedora/RHEL:
```bash
sudo dnf install wget xorriso
```

## Testing

### Virtual Machine Testing
Test the ISO in QEMU before using with v86:
```bash
qemu-system-x86_64 -cdrom alpine-midori-kiosk.iso -m 512M
```

### v86 Testing
1. Load the ISO in v86 emulator
2. Configure with at least 256MB RAM
3. Wait for boot and package installation (first boot only)
4. Browser should appear automatically

## Troubleshooting

### Browser doesn't start
- Check if X11 started: Look for X server messages
- Verify Midori installed: Boot to tty2, login as root, run `apk info midori`
- Check logs: `/var/log/Xorg.0.log`

### Slow first boot
- First boot downloads and installs packages (~150MB)
- Subsequent boots are much faster
- Consider pre-installing packages in the ISO for faster first boot

### Screen resolution issues
- VESA driver uses default resolution
- Can be changed with xrandr after X11 starts
- Add to `.xinitrc`: `xrandr -s 1024x768`

### Network not working
- Alpine uses `setup-alpine` for network configuration
- For DHCP, add to setup script: `setup-interfaces -a`
- For static IP, manually configure `/etc/network/interfaces`

## Security Considerations

### Kiosk Mode Security
- User has limited shell access
- No password authentication (auto-login)
- Browser runs as unprivileged user
- System is read-only from ISO (changes lost on reboot)

### Hardening Options
1. Disable tty2 access (remove from inittab)
2. Restrict browser navigation (Midori preferences)
3. Add content filtering proxy
4. Use HTTPS-only mode
5. Disable browser developer tools

## File Sizes

- Base Alpine ISO: ~160 MB
- Customized ISO: ~160 MB (similar, just modified)
- Downloaded packages (first boot): ~150 MB
- Total RAM usage: ~200-300 MB
- Disk usage (if installed): ~500 MB

## Performance Metrics

Typical boot times on v86:
- BIOS/bootloader: 2-5 seconds
- Kernel boot: 3-8 seconds
- Service startup: 2-5 seconds
- Auto-login: 1-2 seconds
- X11 start: 5-10 seconds
- Browser launch: 3-8 seconds
- **Total first boot**: 60-120 seconds (package installation)
- **Total subsequent boots**: 20-40 seconds

## License

This configuration uses Alpine Linux and various open-source packages:
- Alpine Linux: MIT-style license
- Midori: LGPL 2.1+
- X.Org: MIT/X11 license
- TWM: MIT/X11 license

Refer to individual package licenses for details.
