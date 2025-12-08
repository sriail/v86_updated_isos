# Alpine Linux Midori Kiosk ISO

This is an extremely optimized Alpine Linux 3.18 ISO designed for v86 that boots directly into Midori browser in fullscreen kiosk mode.

## Features

- Based on Alpine Linux 3.18 (minimal footprint)
- Optimized for v86 emulator
- Auto-boots into Midori browser in kiosk mode
- No login required (auto-login)
- Fullscreen browser experience
- Minimal resource usage

## Building the ISO

To build the ISO, you need:
- A Linux system with Docker installed
- Internet connection to download Alpine packages

Run the build script:
```bash
cd alpine-midori-kiosk
./build.sh
```

The ISO will be created as `alpine-midori-kiosk.iso` in the current directory.

## Using with v86

Load the ISO in v86 emulator. The system will:
1. Boot Alpine Linux
2. Auto-login as the kiosk user
3. Start X11 with minimal window manager
4. Launch Midori browser in fullscreen kiosk mode

## Configuration

The system includes:
- Tiny window manager (TWM) for X11
- Midori browser configured for kiosk mode
- Auto-login for immediate browser access
- Optimized kernel and initramfs for v86

## Technical Details

- Base: Alpine Linux 3.18
- Display Server: X.Org
- Window Manager: TWM (minimal)
- Browser: Midori
- Init System: OpenRC
