// V86 Emulator Controller
import V86Starter from './lib/libv86.mjs';

let emulator = null;
let startTime = null;
let metricsInterval = null;
let savedState = null;
let ramSize = 128; // MB
let vramSize = 8; // MB
let storageEstimate = 0; // Track estimated storage usage in bytes
let importedBlobUrls = []; // Track blob URLs for cleanup
let importedFiles = new Set(); // Track imported file names to avoid double-counting
let isPointerLocked = false;
let pointerLockRequested = false;
let lastMetricsTime = Date.now();
let isPaused = false;
let audioEnabled = true;
let currentScale = 1;

// Load preferences from localStorage
function loadPreferences() {
    const savedAudio = localStorage.getItem('v86AudioEnabled');
    const savedScale = localStorage.getItem('v86ScreenScale');
    
    if (savedAudio !== null) {
        audioEnabled = savedAudio === 'true';
        elements.audioEnabled.checked = audioEnabled;
    }
    
    if (savedScale !== null) {
        elements.screenScale.value = savedScale;
    }
}

// Save preferences to localStorage
function savePreferences() {
    localStorage.setItem('v86AudioEnabled', audioEnabled.toString());
    localStorage.setItem('v86ScreenScale', elements.screenScale.value);
}

// Performance metrics constants - removed estimation constants

// DOM Elements
const elements = {
    startBtn: document.getElementById('start-btn'),
    stopBtn: document.getElementById('stop-btn'),
    resetBtn: document.getElementById('reset-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    screenshotBtn: document.getElementById('screenshot-btn'),
    saveStateBtn: document.getElementById('save-state-btn'),
    restoreStateBtn: document.getElementById('restore-state-btn'),
    importIsoBtn: document.getElementById('import-iso-btn'),
    exportStateBtn: document.getElementById('export-state-btn'),
    dumpMemoryBtn: document.getElementById('dump-memory-btn'),
    cursorLockBtn: document.getElementById('cursor-lock-btn'),
    fileInput: document.getElementById('file-input'),
    ramSetting: document.getElementById('ram-setting'),
    vramSetting: document.getElementById('vram-setting'),
    isoSelect: document.getElementById('iso-select'),
    audioEnabled: document.getElementById('audio-enabled'),
    screenScale: document.getElementById('screen-scale'),
    speedMetric: document.getElementById('speed-metric'),
    memoryMetric: document.getElementById('memory-metric'),
    ipsMetric: document.getElementById('ips-metric'),
    statusMetric: document.getElementById('status-metric'),
    uptimeMetric: document.getElementById('uptime-metric'),
    ramAllocated: document.getElementById('ram-allocated'),
    vramAllocated: document.getElementById('vram-allocated'),
    storageUsed: document.getElementById('storage-used'),
    log: document.getElementById('log'),
    screenContainer: document.getElementById('screen_container'),
    mouseLockDialog: document.getElementById('mouse-lock-dialog'),
    mouseLockProceed: document.getElementById('mouse-lock-proceed'),
    mouseLockCancel: document.getElementById('mouse-lock-cancel'),
    mouseLockDontShow: document.getElementById('mouse-lock-dont-show'),
    networkMode: document.getElementById('network-mode'),
    wispUrl: document.getElementById('wisp-url'),
    wispUrlContainer: document.getElementById('wisp-url-container'),
    relayUrl: document.getElementById('relay-url'),
    relayUrlContainer: document.getElementById('relay-url-container')
};

// Validate WebSocket URL
function validateWebSocketUrl(url) {
    if (!url) {
        return { valid: false, error: 'URL is required' };
    }
    try {
        const urlObj = new URL(url);
        if (urlObj.protocol !== 'wss:' && urlObj.protocol !== 'ws:') {
            return { valid: false, error: 'URL must use wss:// or ws:// protocol' };
        }
        return { valid: true };
    } catch (error) {
        return { valid: false, error: 'URL is not valid' };
    }
}

// Logging function
function log(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-message">${message}</span>`;
    elements.log.appendChild(entry);
    elements.log.scrollTop = elements.log.scrollHeight;
    
    // Keep only last 100 log entries
    while (elements.log.children.length > 100) {
        elements.log.removeChild(elements.log.firstChild);
    }
}

// Apply screen scaling
function applyScreenScale(scale) {
    const canvas = elements.screenContainer.querySelector('canvas');
    if (!canvas) return;
    
    if (scale === 'fit') {
        // Fit to container
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.maxWidth = '100%';
        canvas.style.imageRendering = 'auto';
        log('Screen scaling: Fit to window');
    } else {
        const scaleValue = parseFloat(scale);
        canvas.style.width = `${scaleValue * 100}%`;
        canvas.style.height = 'auto';
        canvas.style.maxWidth = 'none';
        canvas.style.imageRendering = 'crisp-edges';
        log(`Screen scaling: ${scaleValue * 100}%`);
    }
    currentScale = scale;
}

// Update metrics
function updateMetrics() {
    if (!emulator || !startTime) return;
    
    // Don't update metrics if paused
    if (isPaused) return;

    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    let uptimeStr = '';
    if (hours > 0) uptimeStr += `${hours}h `;
    if (minutes > 0 || hours > 0) uptimeStr += `${minutes}m `;
    uptimeStr += `${seconds}s`;
    
    elements.uptimeMetric.textContent = uptimeStr;

    // Try to get emulator stats
    try {
        const stats = emulator.get_statistics();
        if (stats && stats.instructions_per_second) {
            // Calculate MIPS (instructions per second / 1,000,000)
            const mips = (stats.instructions_per_second / 1000000).toFixed(2);
            elements.speedMetric.textContent = `${mips} MIPS`;
            
            // Format IPS with commas
            const ips = Math.floor(stats.instructions_per_second).toLocaleString();
            elements.ipsMetric.textContent = ips;
        } else {
            // Still initializing
            elements.speedMetric.textContent = 'Starting...';
            elements.ipsMetric.textContent = 'Starting...';
        }
    } catch (e) {
        // Stats might not be available yet
        elements.speedMetric.textContent = 'N/A';
        elements.ipsMetric.textContent = 'N/A';
    }

    // Memory usage - try to get actual memory info if available
    elements.memoryMetric.textContent = `${ramSize} MB`;
    
    // Update resource consumption metrics
    elements.ramAllocated.textContent = `${ramSize} MB`;
    elements.vramAllocated.textContent = `${vramSize} MB`;
    
    // Update storage
    const storageMB = (storageEstimate / (1024 * 1024)).toFixed(2);
    elements.storageUsed.textContent = `${storageMB} MB`;
}

// Initialize emulator
function initEmulator() {
    log('Initializing V86 emulator...');
    elements.statusMetric.textContent = 'Initializing...';

    // Get settings from UI
    ramSize = parseInt(elements.ramSetting.value);
    vramSize = parseInt(elements.vramSetting.value);
    const isoPath = elements.isoSelect.value;
    audioEnabled = elements.audioEnabled.checked;

    log(`Configuration: RAM=${ramSize}MB, VRAM=${vramSize}MB, ISO=${isoPath}, Audio=${audioEnabled ? 'Enabled' : 'Disabled'}`);

    // Get network configuration
    const networkMode = elements.networkMode.value;
    const wispUrl = elements.wispUrl.value.trim();
    const relayUrl = elements.relayUrl.value.trim();

    const config = {
        wasm_path: "lib/v86.wasm",
        memory_size: ramSize * 1024 * 1024,
        vga_memory_size: vramSize * 1024 * 1024,
        screen_container: elements.screenContainer,
        bios: {
            url: "lib/seabios.bin",
            async: true, // Enable async loading for faster initialization
        },
        vga_bios: {
            url: "lib/vgabios.bin",
            async: true, // Enable async loading for faster initialization
        },
        cdrom: {
            url: isoPath,
            async: true, // Enable async loading for CD-ROM
        },
        boot_order: 0x123, // Boot from CD-ROM first
        autostart: true,
        acpi: true, // Enable ACPI for advanced power management features
        fastboot: true, // Skip BIOS setup delays for faster boot time
        disable_speaker: !audioEnabled, // Enable/disable audio based on user preference
        disable_jit: false, // Ensure JIT is enabled for better performance
    };

    // Add network configuration if enabled
    if (networkMode === 'wisp') {
        const validation = validateWebSocketUrl(wispUrl);
        if (!validation.valid) {
            log(`Error: WISP server URL validation failed - ${validation.error}`, 'error');
            elements.statusMetric.textContent = 'Configuration Error';
            elements.startBtn.disabled = false;
            return;
        }
        log(`Enabling network with WISP server: ${wispUrl}`);
        config.network_relay_url = wispUrl;
    } else if (networkMode === 'host') {
        const validation = validateWebSocketUrl(relayUrl);
        if (!validation.valid) {
            log(`Error: Relay server URL validation failed - ${validation.error}`, 'error');
            elements.statusMetric.textContent = 'Configuration Error';
            elements.startBtn.disabled = false;
            return;
        }
        log(`Enabling network with host connection (relay): ${relayUrl}`);
        config.network_relay_url = relayUrl;
    } else {
        log('Network disabled');
    }

    try {
        emulator = new V86Starter(config);
        
        emulator.add_listener("emulator-started", function() {
            log('Emulator started successfully');
            elements.statusMetric.textContent = 'Running';
            startTime = Date.now();
            
            // Apply screen scaling
            setTimeout(() => {
                applyScreenScale(elements.screenScale.value);
            }, 100);
            
            // Enable controls
            elements.stopBtn.disabled = false;
            elements.resetBtn.disabled = false;
            elements.pauseBtn.disabled = false;
            elements.fullscreenBtn.disabled = false;
            elements.screenshotBtn.disabled = false;
            elements.saveStateBtn.disabled = false;
            elements.exportStateBtn.disabled = false;
            elements.dumpMemoryBtn.disabled = false;
            elements.cursorLockBtn.disabled = false;
            if (savedState) {
                elements.restoreStateBtn.disabled = false;
            }
            elements.startBtn.disabled = true;

            // Disable settings during runtime
            elements.ramSetting.disabled = true;
            elements.vramSetting.disabled = true;
            elements.isoSelect.disabled = true;
            elements.audioEnabled.disabled = true;
            elements.networkMode.disabled = true;
            elements.wispUrl.disabled = true;
            elements.relayUrl.disabled = true;

            // Start metrics updates
            metricsInterval = setInterval(updateMetrics, 1000);
        });

        emulator.add_listener("emulator-stopped", function() {
            log('Emulator stopped');
            elements.statusMetric.textContent = 'Stopped';
            
            // Re-enable settings
            elements.ramSetting.disabled = false;
            elements.vramSetting.disabled = false;
            elements.isoSelect.disabled = false;
            elements.audioEnabled.disabled = false;
            elements.networkMode.disabled = false;
            elements.wispUrl.disabled = false;
            elements.relayUrl.disabled = false;
            
            if (metricsInterval) {
                clearInterval(metricsInterval);
                metricsInterval = null;
            }
        });

        emulator.add_listener("download-progress", function(e) {
            if (e.file_name && e.loaded !== undefined && e.total !== undefined) {
                const percent = ((e.loaded / e.total) * 100).toFixed(1);
                log(`Downloading ${e.file_name}: ${percent}%`);
                
                // Track storage estimate - accumulate total storage used
                if (e.loaded === e.total && !importedFiles.has(e.file_name)) {
                    storageEstimate += e.total;
                    importedFiles.add(e.file_name);
                }
            }
        });

        emulator.add_listener("download-error", function(e) {
            const fileName = e.file_name || 'file';
            log(`Error downloading ${fileName}. Please check the file exists.`, 'error');
            elements.statusMetric.textContent = 'Download Error';
            
            // Re-enable start button and settings on error
            elements.startBtn.disabled = false;
            elements.ramSetting.disabled = false;
            elements.vramSetting.disabled = false;
            elements.isoSelect.disabled = false;
            elements.audioEnabled.disabled = false;
            elements.networkMode.disabled = false;
            elements.wispUrl.disabled = false;
            elements.relayUrl.disabled = false;
        });
        
        // Add listener for when emulator is ready
        emulator.add_listener("emulator-ready", function() {
            log('Emulator initialized and ready');
        });

    } catch (error) {
        log(`Error initializing emulator: ${error.message}`, 'error');
        elements.statusMetric.textContent = 'Error';
        elements.startBtn.disabled = false;
        elements.ramSetting.disabled = false;
        elements.vramSetting.disabled = false;
        elements.isoSelect.disabled = false;
        elements.networkMode.disabled = false;
        elements.wispUrl.disabled = false;
        elements.relayUrl.disabled = false;
        console.error(error);
    }
}

// Stop emulator
function stopEmulator() {
    if (emulator) {
        log('Stopping emulator...');
        emulator.stop();
        
        // Release pointer lock if active
        if (document.pointerLockElement === elements.screenContainer) {
            document.exitPointerLock();
        }
        
        // Disable controls
        elements.stopBtn.disabled = true;
        elements.resetBtn.disabled = true;
        elements.pauseBtn.disabled = true;
        elements.fullscreenBtn.disabled = true;
        elements.screenshotBtn.disabled = true;
        elements.saveStateBtn.disabled = true;
        elements.restoreStateBtn.disabled = true;
        elements.exportStateBtn.disabled = true;
        elements.dumpMemoryBtn.disabled = true;
        elements.cursorLockBtn.disabled = true;
        elements.startBtn.disabled = false;
        
        // Re-enable settings
        elements.ramSetting.disabled = false;
        elements.vramSetting.disabled = false;
        elements.isoSelect.disabled = false;
        elements.audioEnabled.disabled = false;
        elements.networkMode.disabled = false;
        elements.wispUrl.disabled = false;
        elements.relayUrl.disabled = false;
        
        // Reset pause state
        isPaused = false;
        
        elements.statusMetric.textContent = 'Stopped';
        
        if (metricsInterval) {
            clearInterval(metricsInterval);
            metricsInterval = null;
        }
    }
}

// Reset emulator
function resetEmulator() {
    if (emulator) {
        log('Resetting emulator...');
        emulator.restart();
        startTime = Date.now();
        isPaused = false;
        elements.statusMetric.textContent = 'Restarting...';
        // Update pause button UI
        elements.pauseBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
            Pause
        `;
    }
}

// Pause/Resume emulator
function togglePause() {
    if (emulator) {
        if (isPaused) {
            log('Resuming emulation...');
            emulator.run();
            isPaused = false;
            elements.statusMetric.textContent = 'Running';
            elements.pauseBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                Pause
            `;
            elements.pauseBtn.title = 'Pause Emulator';
        } else {
            log('Pausing emulation...');
            emulator.stop();
            isPaused = true;
            elements.statusMetric.textContent = 'Paused';
            elements.pauseBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                Resume
            `;
            elements.pauseBtn.title = 'Resume Emulator';
        }
    }
}

// Dump memory
function dumpMemory() {
    if (emulator) {
        log('Dumping memory...');
        try {
            emulator.save_state(function(error, state) {
                if (error) {
                    log(`Error dumping memory: ${error}`, 'error');
                } else {
                    // Create download link for memory dump
                    const blob = new Blob([state], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `v86-memory-${Date.now()}.bin`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                    
                    log(`Memory dumped (${(state.byteLength / 1024 / 1024).toFixed(2)} MB)`);
                }
            });
        } catch (error) {
            log(`Error dumping memory: ${error.message}`, 'error');
        }
    }
}

// Toggle fullscreen
function toggleFullscreen() {
    const elem = elements.screenContainer;
    
    if (!document.fullscreenElement) {
        elem.requestFullscreen().then(() => {
            log('Entered fullscreen mode');
        }).catch(err => {
            log(`Error entering fullscreen: ${err.message}`, 'error');
        });
    } else {
        document.exitFullscreen().then(() => {
            log('Exited fullscreen mode');
        });
    }
}

// Take screenshot
function takeScreenshot() {
    if (emulator) {
        try {
            const screenshot = emulator.screen_make_screenshot();
            const canvas = screenshot.toDataURL("image/png");
            
            // Create download link
            const link = document.createElement('a');
            link.download = `v86-screenshot-${Date.now()}.png`;
            link.href = canvas;
            link.click();
            
            log('Screenshot saved');
        } catch (error) {
            log(`Error taking screenshot: ${error.message}`, 'error');
        }
    }
}

// Save state
function saveState() {
    if (emulator) {
        log('Saving emulator state...');
        emulator.save_state(function(error, state) {
            if (error) {
                log(`Error saving state: ${error}`, 'error');
            } else {
                savedState = state;
                elements.restoreStateBtn.disabled = false;
                log(`State saved (${(state.byteLength / 1024).toFixed(2)} KB)`);
            }
        });
    }
}

// Restore state
function restoreState() {
    if (emulator && savedState) {
        log('Restoring emulator state...');
        emulator.restore_state(savedState);
        log('State restored');
    }
}

// Import ISO/Image
function importFile() {
    elements.fileInput.click();
}

// Handle file import
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    log(`Importing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    const reader = new FileReader();
    
    if (file.name.endsWith('.state')) {
        // Import state file
        reader.onload = function(e) {
            savedState = e.target.result;
            elements.restoreStateBtn.disabled = false;
            log(`State file imported successfully`);
            
            // Track storage if not already imported
            if (!importedFiles.has(file.name)) {
                storageEstimate += file.size;
                importedFiles.add(file.name);
            }
        };
        reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.iso') || file.name.endsWith('.img')) {
        // Import ISO/IMG file
        reader.onload = function(e) {
            // Create a blob URL for the imported file
            const blob = new Blob([e.target.result], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            // Track blob URL for cleanup
            importedBlobUrls.push(url);
            
            // Add to ISO select dropdown
            const option = document.createElement('option');
            option.value = url;
            option.textContent = file.name;
            elements.isoSelect.appendChild(option);
            elements.isoSelect.value = url;
            
            log(`ISO/Image imported: ${file.name}`);
            
            // Track storage if not already imported
            if (!importedFiles.has(file.name)) {
                storageEstimate += file.size;
                importedFiles.add(file.name);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        log(`Unsupported file type: ${file.name}`, 'error');
    }
    
    // Reset file input
    event.target.value = '';
}

// Export state
function exportState() {
    if (emulator) {
        log('Exporting emulator state...');
        emulator.save_state(function(error, state) {
            if (error) {
                log(`Error exporting state: ${error}`, 'error');
            } else {
                // Create download link
                const blob = new Blob([state], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `v86-state-${Date.now()}.state`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
                
                log(`State exported (${(state.byteLength / 1024).toFixed(2)} KB)`);
            }
        });
    }
}

// Helper function to check if mouse lock dialog should be skipped
function shouldSkipMouseLockDialog() {
    return localStorage.getItem('mouseLockDontShow') === 'true';
}

// Pointer lock functionality
function requestPointerLock() {
    if (!emulator) {
        log('Emulator must be running to lock cursor', 'error');
        return;
    }
    
    if (shouldSkipMouseLockDialog()) {
        // Directly lock pointer without showing dialog
        lockPointer();
    } else {
        // Show confirmation dialog
        pointerLockRequested = true;
        elements.mouseLockDialog.style.display = 'flex';
    }
}

function lockPointer() {
    elements.screenContainer.requestPointerLock();
}

function unlockPointer() {
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}

function togglePointerLock() {
    if (isPointerLocked) {
        unlockPointer();
    } else {
        requestPointerLock();
    }
}

// Handle pointer lock changes
function handlePointerLockChange() {
    isPointerLocked = document.pointerLockElement === elements.screenContainer;
    
    if (isPointerLocked) {
        log('Mouse cursor locked to emulator window');
        elements.screenContainer.classList.add('cursor-locked');
        elements.cursorLockBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10A2,2 0 0,1 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17Z"/>
            </svg>
            Unlock Cursor
        `;
        elements.cursorLockBtn.title = 'Unlock Cursor (ESC)';
    } else {
        log('Mouse cursor unlocked');
        elements.screenContainer.classList.remove('cursor-locked');
        elements.cursorLockBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.47,2.09 7.64,2.23L7.65,2.22L19.14,11.86C19.57,12.22 19.62,12.85 19.27,13.27C19.12,13.45 18.91,13.57 18.7,13.61L15.54,14.23L17.74,18.96C18,19.46 17.76,20.05 17.26,20.28L13.64,21.97Z"/>
            </svg>
            Lock Cursor
        `;
        elements.cursorLockBtn.title = 'Lock/Unlock Cursor';
    }
}

// Handle pointer lock errors
function handlePointerLockError() {
    log('Failed to lock cursor', 'error');
    isPointerLocked = false;
}

// Event Listeners
elements.startBtn.addEventListener('click', initEmulator);
elements.stopBtn.addEventListener('click', stopEmulator);
elements.resetBtn.addEventListener('click', resetEmulator);
elements.pauseBtn.addEventListener('click', togglePause);
elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
elements.screenshotBtn.addEventListener('click', takeScreenshot);
elements.saveStateBtn.addEventListener('click', saveState);
elements.restoreStateBtn.addEventListener('click', restoreState);
elements.importIsoBtn.addEventListener('click', importFile);
elements.exportStateBtn.addEventListener('click', exportState);
elements.dumpMemoryBtn.addEventListener('click', dumpMemory);
elements.cursorLockBtn.addEventListener('click', togglePointerLock);
elements.fileInput.addEventListener('change', handleFileImport);

// Mouse lock dialog event listeners
elements.mouseLockProceed.addEventListener('click', function() {
    // Save preference if checkbox is checked
    if (elements.mouseLockDontShow.checked) {
        localStorage.setItem('mouseLockDontShow', 'true');
        log('Mouse lock preference saved - dialog will not show again');
    }
    
    elements.mouseLockDialog.style.display = 'none';
    lockPointer();
});

elements.mouseLockCancel.addEventListener('click', function() {
    elements.mouseLockDialog.style.display = 'none';
    pointerLockRequested = false;
    
    // Reset checkbox for next time
    elements.mouseLockDontShow.checked = false;
});

// Pointer lock event listeners
document.addEventListener('pointerlockchange', handlePointerLockChange);
document.addEventListener('pointerlockerror', handlePointerLockError);

// Optional: Auto-request pointer lock when clicking on screen (with dialog)
elements.screenContainer.addEventListener('click', function() {
    if (emulator && !isPointerLocked && !pointerLockRequested) {
        // Only show dialog if emulator is running
        if (!elements.stopBtn.disabled) {
            requestPointerLock();
        }
    }
});

// Handle fullscreen change
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        elements.fullscreenBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
            Exit Fullscreen
        `;
        
        // Auto-lock cursor in fullscreen if preference is set and emulator is running
        if (shouldSkipMouseLockDialog() && emulator && !isPointerLocked && !elements.stopBtn.disabled) {
            requestPointerLock();
        }
    } else {
        elements.fullscreenBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
            Fullscreen
        `;
    }
});

// Load user preferences
loadPreferences();

// Initial log message
log('V86 Emulator ready. Multiple OS options available.');
log('Configuration:');
log('- Adjust RAM and VRAM settings above');
log('- Select from available ISOs or import your own');
log('- Click "Start" to begin emulation');
log('');
log('Available Operating Systems:');
log('- SliTaz 5.0 (32-bit Linux)');
log('- TinyCore Linux (minimal)');
log('- Bodhi Linux 5.1.0 Legacy');
log('- NanoLinux 64 1.3');
log('- ReactOS 0.4.15 (Windows-like OS)');
log('- Or import your own ISO file');

// Update status and initial resource metrics
elements.statusMetric.textContent = 'Ready';
elements.ramAllocated.textContent = `${elements.ramSetting.value} MB`;
elements.vramAllocated.textContent = `${elements.vramSetting.value} MB`;
elements.storageUsed.textContent = '0 MB';

// Update resource metrics when settings change
elements.ramSetting.addEventListener('input', function() {
    elements.ramAllocated.textContent = `${this.value} MB`;
});

elements.vramSetting.addEventListener('input', function() {
    elements.vramAllocated.textContent = `${this.value} MB`;
});

// Network mode selection handler
elements.networkMode.addEventListener('change', function() {
    if (this.value === 'wisp') {
        elements.wispUrlContainer.style.display = 'block';
        elements.relayUrlContainer.style.display = 'none';
    } else if (this.value === 'host') {
        elements.wispUrlContainer.style.display = 'none';
        elements.relayUrlContainer.style.display = 'block';
    } else {
        elements.wispUrlContainer.style.display = 'none';
        elements.relayUrlContainer.style.display = 'none';
    }
});

// Screen scale selection handler
elements.screenScale.addEventListener('change', function() {
    if (emulator) {
        applyScreenScale(this.value);
    }
    savePreferences();
});

// Audio checkbox handler
elements.audioEnabled.addEventListener('change', function() {
    savePreferences();
});

// Cleanup blob URLs on page unload to prevent memory leaks
window.addEventListener('beforeunload', function() {
    importedBlobUrls.forEach(url => URL.revokeObjectURL(url));
    importedBlobUrls = [];
});
