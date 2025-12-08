# Quick Start Guide - v86 Emulator with Enhanced Features

## Overview
The v86 emulator now includes configurable VM settings, resource monitoring, and import/export capabilities.

## Getting Started

### 1. Initial Setup
```bash
# Install dependencies
npm install

# Start web server
cd public && python3 -m http.server 8000

# Open in browser
http://localhost:8000
```

### 2. Configure VM Settings (Before Starting)

**Adjust settings in the VM Settings panel:**
- **RAM**: Choose between 64-512 MB (default: 128 MB)
  - Lower RAM (64-128 MB): Best for lightweight Linux distros
  - Higher RAM (256-512 MB): Better for full desktop environments
  
- **VRAM**: Choose between 2-16 MB (default: 8 MB)
  - 2-4 MB: Sufficient for text mode or basic graphics
  - 8-16 MB: Better for graphical desktop environments

- **ISO**: Select which operating system to boot
  - Default: SliTaz 5.0 Rolling (if placed in public/iso/)
  - Use Import button to add more ISOs

### 3. Load an Operating System

**Option A: Use Pre-placed ISO**
1. Download SliTaz ISO from http://mirror.slitaz.org/iso/rolling/
2. Save as `public/iso/slitaz-rolling.iso`
3. Refresh page - it will appear in the ISO dropdown
4. Click "Start"

**Option B: Import ISO at Runtime**
1. Click the "Import" button
2. Select your .iso file
3. It will automatically appear in the dropdown and be selected
4. Click "Start"

### 4. Monitor Resources

**Performance Metrics:**
- Speed: Current emulation speed in MIPS
- Memory: Total allocated RAM
- Instructions/sec: Raw instruction count
- Status: Emulator state (Ready/Running/Stopped)
- Uptime: How long the VM has been running

**Resource Consumption:**
- RAM Allocated: Total RAM assigned to VM
- RAM Usage: Estimated percentage in use
- VRAM Allocated: Video memory assigned
- Storage Used: Total size of loaded files

### 5. Control the Emulator

**Available Actions:**
- **Start**: Begin emulation with current settings
- **Stop**: Halt emulator and unlock settings
- **Reset**: Restart the VM
- **Fullscreen**: Expand display to fullscreen
- **Screenshot**: Save current display as PNG
- **Save**: Store VM state in memory
- **Restore**: Load previously saved state
- **Import**: Load new ISO/IMG/STATE files
- **Export**: Download current VM state to file

### 6. Save and Restore

**To save your progress:**
1. Click "Save" while emulator is running
2. State is saved to browser memory
3. "Restore" button becomes enabled

**To export state for backup:**
1. Click "Export" while emulator is running
2. Downloads .state file to your computer
3. Can be imported later using "Import" button

## Tips and Tricks

### Performance Optimization
- Start with lower RAM (128 MB) for better performance
- Increase RAM only if needed by the OS
- VRAM of 8 MB is sufficient for most use cases

### Storage Management
- Monitor "Storage Used" to track memory consumption
- Imported files are tracked to avoid double-counting
- Export important states before closing browser

### Troubleshooting
- If ISO fails to load, check browser console (F12)
- Ensure ISO path is correct in dropdown
- Try importing ISO directly if folder placement fails
- Settings are locked while running - stop to change them

## Supported File Types

**Import supports:**
- `.iso` - Operating system ISO images
- `.img` - Raw disk images
- `.state` - Exported emulator states

**Export produces:**
- `.state` - Complete emulator state snapshot
- `.png` - Screenshots of current display

## Recommended Settings by OS

### SliTaz 5.0 (Lightweight)
- RAM: 128 MB
- VRAM: 8 MB
- Boot: Fast and responsive

### Debian/Ubuntu (Full Desktop)
- RAM: 256-512 MB
- VRAM: 16 MB
- Boot: Slower but full featured

### DOS/Windows 95 (Retro)
- RAM: 64-128 MB
- VRAM: 4 MB
- Boot: Very fast

## Console Log

The console log at the bottom shows:
- Initialization status
- Download progress for ISOs
- State save/restore operations
- Error messages (if any)
- System guidance and tips

Keep an eye on it during initial setup!

## Browser Compatibility

Requires modern browser with WebAssembly:
- Chrome/Edge 57+
- Firefox 52+
- Safari 11+

## Next Steps

1. Try different RAM/VRAM combinations
2. Import your favorite lightweight Linux distros
3. Save interesting states for quick restoration
4. Export states to share with others
5. Take screenshots of cool setups

Enjoy your enhanced v86 emulator! 🚀
