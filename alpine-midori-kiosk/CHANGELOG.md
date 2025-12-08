# Changelog - Alpine Linux Midori Kiosk

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-12-08

### Added
- Initial release of Alpine Linux Midori Kiosk ISO
- Based on Alpine Linux 3.18.6
- Auto-boot configuration with 10-second timeout
- Auto-login as kiosk user
- Automatic X11 startup on tty1
- Midori browser in fullscreen kiosk mode
- Optimizations for v86 emulator
- Build script (`build.sh`) for creating custom ISO
- Configuration validation script (`test-config.sh`)
- Comprehensive documentation:
  - README.md - Overview and features
  - TECHNICAL.md - Technical details and architecture
  - QUICKSTART.md - Quick start guide
  - v86-demo.html - Demo HTML page for v86
- Minimal package set for fast boot:
  - xorg-server with VESA driver
  - TWM window manager (~100KB)
  - Midori browser
  - Essential fonts and libraries

### Features
- ISO size: 189MB
- First boot time: 60-120 seconds (package installation)
- Subsequent boot time: 20-40 seconds
- RAM usage: 200-300MB
- Auto-configuration on first boot
- DHCP networking by default
- No password required (auto-login)

### Optimizations
- Minimal Alpine Linux base
- VESA graphics driver (universal compatibility)
- Tiny window manager (TWM)
- Optimized boot parameters (quiet mode)
- Fast boot timeout (10 seconds)
- Efficient package installation script

### Known Limitations
- First boot requires internet connection for package installation
- No persistent storage (changes lost on reboot from ISO)
- Limited to VESA graphics (no 3D acceleration)
- No built-in security features (suitable for kiosk use only)

### Build Requirements
- Linux system with sudo access
- wget (for downloading Alpine ISO)
- xorriso or genisoimage (for creating bootable ISO)
- ~500MB disk space

### Tested With
- v86 emulator (recommended configuration: 512MB RAM)
- QEMU (qemu-system-x86_64)
- VirtualBox
- VMware

### Future Improvements
- Pre-installed packages in ISO (eliminate first-boot download)
- Multiple browser options
- Persistent storage support
- Network configuration options
- Security hardening options
- Custom branding support
