# v86_updated_isos

Modern ISO's optimized for v86 emulation with CDN-hosted operating systems.

## V86 Web Emulator

A clean, feature-rich website that uses the v86 emulator to run multiple operating systems with configurable settings and resource monitoring.

### Screenshot

![V86 Emulator Interface](https://github.com/user-attachments/assets/e62836c0-0c6b-4e37-b547-b9f682a6eb7a)

### Features

- ✨ Clean, minimalist design
- 🎨 Automatic dark/light theme based on browser preferences
- 🌐 **Built-in Network Relay Server** - Network enabled by default using WISP protocol
- 🔄 **V86 Library Switcher** - Choose between V86 Standard and V86 Modern (@sriail/v86_modern)
- 📦 **CDN-Hosted Operating Systems** - No need to download ISOs manually
- ⚙️ **Configurable VM Settings:**
  - Adjustable RAM (64-4096 MB)
  - Adjustable VRAM (2-256 MB)
  - Multiple OS selection from CDN
  - Network configuration (None, WISP, or Host Relay)
- 📊 **Dual Metrics Dashboard:**
  - Real-time performance metrics (MIPS, memory, instructions/sec, uptime)
  - Resource consumption monitoring (RAM allocated, VRAM, storage)
- 🎮 **Complete control panel:**
  - Start/Stop/Reset emulator
  - Pause/Resume functionality
  - Fullscreen mode
  - Screenshot capture
  - Save/Restore state
  - **Import ISO/images** - Load ISO files directly from your computer
  - **Export states** - Download emulator state for backup or sharing
  - Cursor lock support
- 📝 Live console log
- 🚫 No local file downloads required - all ISOs served from CDN

### Available Operating Systems (CDN-Hosted)

All operating systems are automatically downloaded from CDN when you start the emulator:

- **TinyCore Linux 13.1** - Minimal, fast-booting Linux (archive.org)
- **SliTaz 5.0** - Lightweight Linux distribution (archive.org)
- **SliTaz Rolling Core 5in1** - Multiple SliTaz variants (archive.org)
- **Bodhi Linux 5.1.0 Legacy** - Ubuntu-based, elegant desktop (archive.org)
- **ReactOS 0.4.14** - Windows-compatible open-source OS (archive.org)
- **NanoLinux 1.4** - Ultra-lightweight Linux (archive.org)

### Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```
   This installs the v86 package and WISP.js for network relay functionality.

2. **Start the server**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:8000`
   
   The built-in server provides:
   - Static file serving for the web interface
   - Network relay using WISP protocol (enabled by default)
   - WebSocket connection on the same port
   - CORS support for CDN-hosted ISOs

3. **Select and Start**
   - Choose an operating system from the dropdown (automatically loads from CDN)
   - Optionally switch between V86 Standard and V86 Modern libraries
   - Adjust RAM and VRAM settings as needed
   - Click **Start** to begin emulation with network enabled

### File Structure

```
.
├── public/
│   ├── index.html          # Main HTML page with library selector
│   ├── styles.css          # Styling with theme support
│   ├── app.js              # Emulator controller with dynamic library loading
│   ├── lib/                # v86 emulator files
│   │   ├── libv86.mjs      # V86 module
│   │   ├── libv86.js       # V86 script version
│   │   ├── v86.wasm        # V86 WebAssembly
│   │   ├── seabios.bin     # BIOS files (included)
│   │   └── vgabios.bin     # VGA BIOS (included)
│   └── iso/                # Optional local ISO directory
├── server.js               # HTTP + WISP server with CORS support
├── package.json
└── README.md
```

### V86 Library Switcher

The emulator now supports switching between different V86 library versions:

- **V86 (Standard)** - The standard v86 emulator library (currently implemented)
- **V86 Modern (@sriail/v86_modern)** - Modern variant (infrastructure ready, package to be published)

To switch libraries:
1. Use the dropdown in the header: "V86 Library"
2. Select your preferred library version
3. Confirm the page reload
4. The selection persists across sessions via localStorage

### Theme Support

The website automatically adapts to your browser's color scheme preference:
- **Light mode**: White background with dark text
- **Dark mode**: Dark grey (#2d2d2d) background with light text

Change your system/browser theme settings to see the interface adapt automatically.

### Usage

#### VM Configuration
1. **Adjust Settings** (before starting):
   - **RAM**: Set between 64-4096 MB (default: 128 MB)
   - **VRAM**: Set between 2-256 MB (default: 8 MB)
   - **ISO**: Select from CDN-hosted options
   - **Library**: Choose V86 Standard or V86 Modern

2. **Select Operating System**:
   - Choose from the dropdown menu
   - ISOs are automatically downloaded from CDN
   - Or use **Import** button to load local ISO files

3. **Start Emulation**:
   - Click **Start** to initialize with selected settings
   - Settings are locked during emulation
   - ISO downloads are shown in console log with progress

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

### Network Configuration

The emulator now includes built-in network support using the WISP protocol!

#### Default Setup
- **Network Relay is enabled by default** when using `npm start`
- The relay server runs on the same port as the web server (8000)
- No additional configuration needed - just start the emulator

#### Network Modes
1. **Host Connection (Default)** - Uses the built-in WISP relay server
   - Provides network access through your host machine
   - URL: `ws://localhost:8000`
   - Works out of the box with `npm start`

2. **WISP Server** - Connect to a custom WISP server
   - Enter a custom WISP server URL (e.g., `wss://wisp.example.com`)
   - Useful for connecting to external proxies

3. **None** - Disable networking
   - VM has no network connectivity

#### Running Servers Separately

You can also run the servers individually:

```bash
# Run the main server (HTTP + Relay) - Recommended
npm start

# Or run the main server on a custom port
node server.js 8080

# Or run standalone WISP server on a different port
npm run wisp
```

#### Technical Details
- Uses [@mercuryworkshop/wisp-js](https://www.npmjs.com/package/@mercuryworkshop/wisp-js)
- WISP = WebSocket over Internet Streaming Protocol
- Provides transparent network access for the VM
- WebSocket and HTTP traffic share the same port

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

