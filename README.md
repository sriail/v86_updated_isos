# v86_updated_isos
more modern iso's optimized for v86

## Available ISOs

### Alpine Linux Midori Kiosk
A minimal, highly optimized Alpine Linux 3.18 ISO that boots directly into Midori browser in fullscreen kiosk mode.

**Features:**
- Extremely lightweight (based on Alpine Linux)
- Auto-boots to browser in ~20-40 seconds
- Optimized for v86 emulator
- Fullscreen kiosk mode
- No login required

**Directory:** `alpine-midori-kiosk/`

[Build Instructions](alpine-midori-kiosk/README.md) | [Technical Documentation](alpine-midori-kiosk/TECHNICAL.md)

## Building ISOs

Each ISO has its own build script. Navigate to the ISO directory and run:

```bash
cd alpine-midori-kiosk
./build.sh
```

See individual README files for specific requirements and instructions.

## Using with v86

Load the generated ISO file in your v86 configuration:

```javascript
var emulator = new V86Starter({
    cdrom: {
        url: "path/to/alpine-midori-kiosk.iso",
    },
    memory_size: 256 * 1024 * 1024, // 256MB
    // ... other configuration
});
```

## Contributing

To add a new optimized ISO:
1. Create a new directory with a descriptive name
2. Include a README.md with build instructions
3. Include a build.sh script to generate the ISO
4. Update this main README with a description
5. Keep ISOs optimized for v86 (small, fast boot, minimal resources)
