# Quick Start Guide - Alpine Linux Midori Kiosk

## What You Get

A 189MB bootable ISO that:
- Boots in ~10 seconds
- Auto-logins (no password needed)
- Launches Midori browser in fullscreen automatically
- Uses minimal RAM (~200-300MB)
- Optimized for v86 emulator

## Building the ISO

### Prerequisites
```bash
# Ubuntu/Debian
sudo apt-get install wget xorriso

# Fedora/RHEL
sudo dnf install wget xorriso
```

### Build Command
```bash
./build.sh
```

The script will:
1. Download Alpine Linux 3.18.6 base ISO (~190MB)
2. Extract and customize the ISO
3. Create `alpine-midori-kiosk.iso` (~189MB)

Build time: ~2-3 minutes (depending on download speed)

## Using with v86

### Basic Configuration

```javascript
var emulator = new V86Starter({
    wasm_path: "v86.wasm",
    memory_size: 256 * 1024 * 1024, // 256MB minimum
    vga_memory_size: 8 * 1024 * 1024,
    screen_container: document.getElementById("screen_container"),
    cdrom: {
        url: "alpine-midori-kiosk.iso",
    },
    autostart: true,
});
```

### Recommended Settings

```javascript
var emulator = new V86Starter({
    wasm_path: "v86.wasm",
    memory_size: 512 * 1024 * 1024, // 512MB for better performance
    vga_memory_size: 16 * 1024 * 1024,
    screen_container: document.getElementById("screen_container"),
    bios: {
        url: "seabios.bin",
    },
    vga_bios: {
        url: "vgabios.bin",
    },
    cdrom: {
        url: "alpine-midori-kiosk.iso",
    },
    boot_order: 0x123, // Boot from CD-ROM first
    autostart: true,
});
```

## Boot Process

### First Boot (60-120 seconds)
1. BIOS initialization (2-5s)
2. Kernel boot (3-8s)
3. Service startup (2-5s)
4. Auto-login (1-2s)
5. Package installation (40-90s) ← Downloads ~150MB
6. X11 start (5-10s)
7. Browser launch (3-8s)

### Subsequent Boots (20-40 seconds)
Package installation is skipped, so much faster!

## Customization

### Change Homepage

Edit the `.xinitrc` file before building:

```bash
# In build.sh, find this line:
exec midori --app=https://www.google.com

# Change to your URL:
exec midori --app=https://your-site.com
```

### Add Network Configuration

The ISO uses DHCP by default. For static IP, add to the overlay:

```bash
cat > overlay/etc/network/interfaces << 'EOF'
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
EOF
```

### Change Browser

Replace Midori with Firefox or Chromium in `00-kiosk-setup.start`:

```bash
# For Firefox:
apk add firefox-esr
# In .xinitrc:
exec firefox --kiosk https://example.com

# For Chromium:
apk add chromium
# In .xinitrc:
exec chromium --kiosk --no-sandbox https://example.com
```

## Troubleshooting

### ISO won't boot in v86
- Ensure boot_order includes CD-ROM (0x123)
- Allocate at least 256MB RAM
- Check browser console for errors

### Browser doesn't appear
- First boot takes 60-120 seconds for package install
- Check if you have internet connectivity in v86
- Try booting to tty2 (Alt+F2) to see error messages

### Slow performance
- Increase memory_size to 512MB or 1GB
- Disable unnecessary Alpine services
- Use a simpler browser (Links2 in graphics mode)

### Network not working
- v86 requires network configuration
- Set up networking in v86 starter options
- Test with: `ping 8.8.8.8` from tty2

## Testing Locally

Test the ISO with QEMU before using with v86:

```bash
# Install QEMU
sudo apt-get install qemu-system-x86

# Run the ISO
qemu-system-x86_64 \
    -cdrom alpine-midori-kiosk.iso \
    -m 512M \
    -vga std \
    -net nic -net user
```

## Performance Tips

1. **Increase RAM**: 512MB or 1GB for smoother experience
2. **Pre-install packages**: Modify build.sh to include packages in ISO
3. **Disable animations**: Configure Midori to disable animations
4. **Use faster browser**: Consider Links2 or NetSurf for extreme speed
5. **Optimize kernel**: Remove unnecessary kernel modules

## Security Notes

⚠️ **This is a kiosk system with minimal security:**
- Auto-login with no password
- Full internet access
- No content filtering
- User can access shell (Alt+F2)

**For production use:**
- Add password authentication
- Configure firewall rules
- Add content filtering proxy
- Disable tty2-tty6 access
- Lock down browser settings

## Advanced Usage

### Persistent Storage

Add a hard drive to save data between reboots:

```javascript
hda: {
    url: "alpine-kiosk-hdd.img",
    size: 1024 * 1024 * 1024, // 1GB
    async: true,
}
```

### Multiple Monitors

v86 doesn't support multiple monitors, but you can:
- Use different browser windows/tabs
- Configure split-screen layout
- Use tmux/screen for terminal multiplexing

### Remote Access

Enable SSH (not recommended for kiosk):

```bash
# Add to setup script:
apk add openssh
rc-update add sshd default
echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
```

## File Structure

```
alpine-midori-kiosk/
├── build.sh              # Main build script
├── test-config.sh        # Configuration validator
├── README.md            # Main documentation
├── TECHNICAL.md         # Technical details
├── QUICKSTART.md        # This file
├── .gitignore           # Git ignore rules
└── alpine-midori-kiosk.iso  # Generated ISO (not in git)
```

## Support

For issues:
1. Check the logs in `/var/log/`
2. Boot to tty2 (Alt+F2) for debugging
3. Run `dmesg` to see kernel messages
4. Check Xorg log: `/var/log/Xorg.0.log`

## License

Based on Alpine Linux and open-source components.
See TECHNICAL.md for license details.
