# v86_updated_isos

Modern ISO's optimized for v86 emulation.

## V86 Web Emulator

A clean, simple website that uses the v86 emulator to run SliTaz 5.0 rolling 32-bit Linux distribution.

### Features

- ✨ Clean, minimalist design
- 🎨 Automatic dark/light theme based on browser preferences
- 📊 Real-time performance metrics (MIPS, memory, instructions/sec, uptime)
- 🎮 Complete control panel with icons:
  - Start/Stop/Reset emulator
  - Fullscreen mode
  - Screenshot capture
  - Save/Restore state
- 📝 Live console log
- 🚫 No CDN dependencies - all files served locally

### Setup Instructions

1. **Install dependencies**
   ```bash
   npm install
   ```
   This installs the v86 package. The emulator files are then copied from `node_modules/v86/build/` to `public/lib/` to serve them without CDN dependencies.

2. **Download BIOS files** (Already included!)
   The BIOS files (`seabios.bin` and `vgabios.bin`) are already included in the repository for convenience.

3. **Download SliTaz ISO**
   - Download SliTaz 5.0 Rolling 32-bit ISO from [SliTaz Mirror](http://mirror.slitaz.org/iso/rolling/)
   - Recommended: `slitaz-rolling.iso` or `slitaz-rolling-core.iso`
   - Place the ISO in `public/iso/` directory

4. **Configure the emulator**
   - Edit `public/app.js`
   - Uncomment the BIOS configuration lines (around line 50-56)
   - Uncomment the cdrom configuration (around line 58-61)
   - Update the ISO filename if needed

5. **Run the website**
   - Open `public/index.html` in a web browser
   - Or use a local web server:
     ```bash
     # Using Python
     cd public && python3 -m http.server 8000
     
     # Using Node.js http-server
     npx http-server public -p 8000
     ```
   - Navigate to `http://localhost:8000`

### File Structure

```
.
├── public/
│   ├── index.html          # Main HTML page
│   ├── styles.css          # Styling with theme support
│   ├── app.js              # Emulator controller
│   ├── lib/                # v86 emulator files
│   │   ├── libv86.js
│   │   ├── v86.wasm
│   │   ├── seabios.bin     # (download separately)
│   │   └── vgabios.bin     # (download separately)
│   └── iso/                # ISO files directory
│       └── slitaz-*.iso    # (download separately)
├── package.json
└── README.md
```

### Theme Support

The website automatically adapts to your browser's color scheme preference:
- **Light mode**: White background with dark text
- **Dark mode**: Dark grey (#2d2d2d) background with light text

Change your system/browser theme settings to see the interface adapt automatically.

### Usage

1. Click **Start** to initialize the emulator
2. Wait for the ISO to load (progress shown in console log)
3. Use the control buttons:
   - **Stop**: Halt the emulator
   - **Reset**: Restart the emulator
   - **Fullscreen**: Toggle fullscreen display
   - **Screenshot**: Capture and download current screen
   - **Save**: Save current emulator state
   - **Restore**: Restore previously saved state

### Performance Metrics

The metrics panel displays:
- **Speed**: Instructions per second in MIPS
- **Memory**: Allocated RAM
- **Instructions/sec**: Raw instruction count
- **Status**: Current emulator state
- **Uptime**: Time since emulator started

### Browser Compatibility

Works in modern browsers with WebAssembly support:
- Chrome/Edge 57+
- Firefox 52+
- Safari 11+

### License

This project uses the v86 emulator which is licensed under the BSD-2-Clause license.

### Links

- [v86 GitHub](https://github.com/copy/v86)
- [v86 Demos](https://copy.sh/v86/)
- [SliTaz Linux](https://www.slitaz.org/)

