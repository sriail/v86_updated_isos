# Proxy System Documentation

This document explains the proxy system and how ISOs are loaded in the V86 emulator.

## Overview

The application has two separate systems:

### 1. ISO Loading (Direct from Archive.org)
**Purpose:** Load operating system ISO files for the VM

**How it works:**
- ISOs are loaded **directly** from archive.org URLs
- No proxy server is used for ISO downloads
- The browser fetches ISOs using standard HTTPS requests
- This avoids 503 errors and network issues with the proxy

**Benefits:**
- Simpler architecture - no proxy needed for ISOs
- Better performance - direct connection to archive.org
- No 503 errors from proxy failures
- Standard browser CORS handling

### 2. VM Network Connectivity (WISP Proxy)
**Purpose:** Provide internet access to the running VM

**How it works:**
- The WISP (WebSocket Internet Streaming Protocol) server runs on port 8000
- Provides network relay for the emulated operating system
- VM traffic is proxied through the WISP server
- This is completely separate from ISO loading

**Benefits:**
- VM can access the internet while running
- Network-enabled operating systems work properly
- Proxy is only used for VM traffic, not for ISO downloads

## What Changed

### Previous Architecture (Problematic)
- ISOs were loaded through `/proxy?url=` endpoint
- Server acted as a proxy between browser and archive.org
- Frequently resulted in 503 errors due to:
  - DNS resolution issues
  - Network timeouts
  - Sandboxed environments blocking external domains
  - Archive.org redirects causing issues

### Current Architecture (Fixed)
- ISOs load directly from `https://archive.org/download/...` URLs
- Browser handles the download using native HTTPS
- Archive.org's CORS headers allow direct access
- Proxy server remains available only for VM network connectivity (WISP)

## ISO URLs in index.html

The ISOs are now configured as direct URLs:

```html
<option value="https://archive.org/download/tinycore-linux-13.1/TinyCore-13.1.iso">TinyCore Linux 13.1</option>
```

Instead of the previous proxied format:
```html
<!-- OLD - No longer used -->
<option value="/proxy?url=https%3A%2F%2Farchive.org%2Fdownload%2F...">...</option>
```

## Server Configuration

### Proxy Endpoint (Still Available)
The `/proxy?url=` endpoint remains in server.js for backward compatibility and potential future use, but it's not used for ISOs anymore.

**Current usage:**
- Available but not actively used by the UI
- Could be used for other resources if needed
- Kept for VM network relay functionality

**Security:**
- Only allows archive.org and subdomains
- Only allows GET and HEAD methods
- 30 second timeout
- Max 5 redirects

### WISP Server (Active)
The WISP server handles WebSocket upgrades for VM network connectivity:

```javascript
server.on('upgrade', (req, socket, head) => {
    wisp.routeRequest(req, socket, head);
});
```

This provides internet access to the running VM.

## Testing

### Test 1: Verify Direct ISO Loading
1. Start the server: `npm start`
2. Open browser to `http://localhost:8000`
3. Open DevTools Network tab
4. Select an ISO from the dropdown
5. Click "Start"
6. **Expected:** Browser makes direct HTTPS request to `archive.org`
7. **Expected:** No requests to `/proxy?url=`
8. **Expected:** ISO downloads successfully

### Test 2: Verify VM Network Connectivity
1. Start an operating system (e.g., TinyCore Linux)
2. Wait for it to boot
3. Inside the VM, try to access the internet
4. **Expected:** Network connectivity works through WISP relay
5. **Expected:** VM can reach external websites

### Test 3: Test in Sandboxed Environment
1. Even if archive.org is blocked at the network level
2. The emulator will show a clear error message
3. **Expected:** "Failed to download ISO" warning
4. **Expected:** Emulator boots to BIOS
5. **Expected:** User can import local ISO files

## Common Scenarios

### Scenario 1: User with Internet Access
- ISOs load directly from archive.org
- Fast and reliable
- No proxy needed

### Scenario 2: User Behind Corporate Firewall
- Archive.org might be blocked
- ISO download fails gracefully
- User can import local ISO files
- VM network relay may or may not work depending on WebSocket support

### Scenario 3: Sandboxed/Offline Environment
- Archive.org is unreachable
- ISO download shows error but doesn't crash
- User must import local ISO files
- VM network won't work without internet access

## Error Handling

The app gracefully handles ISO download failures:

```javascript
emulator.add_listener("download-error", function(e) {
    // Non-critical files (ISOs) allow emulator to continue
    // Critical files (BIOS, WASM) prevent startup
});
```

**For ISO failures:**
- Warning message in console
- Emulator boots to BIOS
- User can import local ISO

**For critical file failures:**
- Error message displayed
- Start button re-enabled
- User must refresh page

## Benefits of Direct Loading

1. **Reliability:** No proxy means fewer points of failure
2. **Performance:** Direct connection is faster
3. **Simplicity:** Less server-side complexity
4. **Compatibility:** Works in more environments
5. **Maintainability:** Standard browser behavior, no custom proxy logic for ISOs

## Proxy Server Remains Important

While ISOs no longer use the proxy, the proxy server is still critical for:
- VM network connectivity (WISP protocol)
- Providing internet access to running VMs
- Network-enabled features in the emulated OS

The proxy server cannot be removed - it serves a different purpose than ISO loading.
