# v86_updated_isos

Modern ISO's optimized for v86 emulation.

## V86 Web Emulator

A clean, feature-rich website that uses the v86 emulator to run SliTaz 5.0 rolling 32-bit Linux distribution with configurable settings and resource monitoring.

### Screenshot

![V86 Emulator Interface](https://github.com/user-attachments/assets/fdc346be-66fa-4108-88d7-574d5354faa8)

### Features

- ✨ Clean, minimalist design
- 🎨 Automatic dark/light theme based on browser preferences
- ⚙️ **Configurable VM Settings:**
  - Adjustable RAM (64-512 MB)
  - Adjustable VRAM (2-16 MB)
  - ISO selection dropdown
- 📊 **Dual Metrics Dashboard:**
  - Real-time performance metrics (MIPS, memory, instructions/sec, uptime)
  - Resource consumption monitoring (RAM allocated, RAM usage %, VRAM, storage)
- 🎮 **Complete control panel:**
  - Start/Stop/Reset emulator
  - Fullscreen mode
  - Screenshot capture
  - Save/Restore state
  - **Import ISO/images** - Load ISO files directly from your computer
  - **Export states** - Download emulator state for backup or sharing
- 📝 Live console log
- 🚫 No CDN dependencies - all files served locally

### Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```
   This installs the v86 package. The emulator files are then copied from `node_modules/v86/build/` to `public/lib/` to serve them without CDN dependencies.

2. **Download BIOS files** (Already included!)
   The BIOS files (`seabios.bin` and `vgabios.bin`) are already included in the repository for convenience.

3. **Get SliTaz ISO** (Two options)
   
   **Option A: Pre-place ISO** (Recommended for first-time setup)
   - Download SliTaz 5.0 Rolling 32-bit ISO from [SliTaz Mirror](http://mirror.slitaz.org/iso/rolling/)
   - Recommended: `slitaz-rolling.iso` or `slitaz-rolling-core.iso`
   - Place the ISO in `public/iso/` directory
   - Rename to `slitaz-rolling.iso`
   
   **Option B: Import at runtime**
   - Start the web server (see step 4)
   - Use the **Import** button in the web interface to load any ISO file

4. **Run the website**
   ```bash
   # Using Python
   cd public && python3 -m http.server 8000
   
   # Using Node.js http-server
   npx http-server public -p 8000
   ```
   Navigate to `http://localhost:8000`

5. **Configure and Start**
   - Adjust RAM and VRAM settings as needed
   - Select or import an ISO file
   - Click **Start** to begin emulation

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

#### VM Configuration
1. **Adjust Settings** (before starting):
   - **RAM**: Set between 64-512 MB (default: 128 MB)
   - **VRAM**: Set between 2-16 MB (default: 8 MB)
   - **ISO**: Select from dropdown or import a new one

2. **Import ISO/Images**:
   - Click **Import** button
   - Select `.iso`, `.img`, or `.state` files
   - Imported ISOs automatically appear in the dropdown

3. **Start Emulation**:
   - Click **Start** to initialize with selected settings
   - Settings are locked during emulation
   - Wait for ISO to load (progress shown in console log)

#### Control Buttons
- **Start**: Initialize the emulator with current settings
- **Stop**: Halt the emulator and unlock settings
- **Reset**: Restart the emulator
- **Fullscreen**: Toggle fullscreen display
- **Screenshot**: Capture and download current screen as PNG
- **Save**: Save current emulator state to memory
- **Restore**: Restore previously saved state
- **Import**: Load ISO, IMG, or STATE files from your computer
- **Export**: Download current emulator state as a file

### Metrics Dashboard

#### Performance Metrics
- **Speed**: Instructions per second in MIPS
- **Memory**: Currently allocated RAM
- **Instructions/sec**: Raw instruction count
- **Status**: Current emulator state
- **Uptime**: Time since emulator started

#### Resource Consumption
- **RAM Allocated**: Total RAM assigned to VM
- **RAM Usage**: Estimated percentage of RAM in use
- **VRAM Allocated**: Video memory assigned to VM
- **Storage Used**: Estimated storage consumed by loaded files

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

