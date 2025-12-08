# Setup Guide for V86 Emulator

## Quick Start

This guide will help you get SliTaz 5.0 running in the V86 emulator.

### Prerequisites

The following files are already included in this repository:
- ✅ v86 emulator library files (in `public/lib/`)
- ✅ BIOS files (seabios.bin, vgabios.bin)
- ✅ HTML, CSS, and JavaScript for the web interface

### What You Need to Download

**SliTaz 5.0 Rolling 32-bit ISO** (Required to boot an operating system)

#### Option 1: Core ISO (Recommended - Smaller, Faster)
```bash
cd public/iso
wget http://mirror.slitaz.org/iso/rolling/slitaz-rolling-core.iso
```
Size: ~15-20 MB

#### Option 2: Full Rolling ISO
```bash
cd public/iso
wget http://mirror.slitaz.org/iso/rolling/slitaz-rolling.iso
```
Size: ~40-50 MB

### Configuration

After downloading the ISO, edit `public/app.js`:

1. Find the configuration section (around line 50-65)
2. Uncomment these lines:
```javascript
cdrom: {
    url: "iso/slitaz-rolling-core.iso",  // or slitaz-rolling.iso
},
boot_order: 0x123, // Boot from CD-ROM first
```

### Running the Emulator

#### Using Python HTTP Server
```bash
cd public
python3 -m http.server 8000
```
Then open: http://localhost:8000

#### Using Node.js http-server
```bash
npx http-server public -p 8000
```
Then open: http://localhost:8000

#### Using PHP Built-in Server
```bash
cd public
php -S localhost:8000
```
Then open: http://localhost:8000

### Using the Emulator

1. Click **Start** button to boot the emulator
2. Wait for the ISO to load (progress shown in console log)
3. SliTaz will boot and display its interface
4. Use the control buttons:
   - **Stop**: Halt the emulator
   - **Reset**: Restart the emulator
   - **Fullscreen**: Toggle fullscreen mode
   - **Screenshot**: Download a PNG of the current screen
   - **Save**: Save the current state to memory
   - **Restore**: Restore a previously saved state

### Performance Metrics

The interface displays real-time metrics:
- **Speed**: Instructions per second in MIPS
- **Memory**: RAM allocated (128 MB)
- **Instructions/sec**: Raw instruction count
- **Status**: Current state (Ready/Running/Stopped)
- **Uptime**: Time since emulator started

### Troubleshooting

**Problem**: Emulator shows "No bootable device"
- **Solution**: Make sure you've downloaded an ISO and configured it in `app.js`

**Problem**: Page loads but emulator won't start
- **Solution**: Check browser console for errors. Ensure you're using a modern browser with WebAssembly support.

**Problem**: ISO not loading
- **Solution**: Verify the ISO file is in `public/iso/` and the filename in `app.js` matches exactly.

**Problem**: Slow performance
- **Solution**: Try using the smaller core ISO, close other browser tabs, or use a faster computer.

### Alternative Operating Systems

While this setup is configured for SliTaz, v86 can run many other operating systems:
- Alpine Linux
- Damn Small Linux (DSL)
- FreeDOS
- KolibriOS
- Windows 98/95
- MS-DOS

To use a different OS, download its ISO and update the `cdrom.url` configuration in `app.js`.

### Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge 57+
- ✅ Firefox 52+
- ✅ Safari 11+

Requires WebAssembly support.

### Theme Support

The interface automatically adapts to your browser/OS theme:
- **Light theme**: White background, dark text
- **Dark theme**: Dark grey background, light text

No configuration needed - it uses CSS `prefers-color-scheme`.
