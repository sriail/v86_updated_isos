# Proxy System Testing Guide

This document explains how to test the improved proxy system that was implemented to fix the 503 errors and preload warnings.

## What Was Fixed

### 1. Preload Resource Warnings
**Problem:** Browser was warning that preloaded resources (v86.wasm, seabios.bin, vgabios.bin) were not used within a few seconds.

**Solution:** Removed the `<link rel="preload">` tags since v86 loads these resources asynchronously. The modulepreload for the main library is kept.

### 2. Proxy 503 Errors  
**Problem:** The proxy was returning 503 errors when trying to load ISOs from archive.org.

**Solution:** 
- Added automatic redirect following (up to 5 redirects)
- Improved error handling to return proper HTTP codes (502 for network errors, 503 for upstream server errors)
- Added User-Agent header for better compatibility
- Enhanced logging for debugging

### 3. Error Handling
**Problem:** The emulator would fail to start if ISO download encountered errors.

**Solution:**
- Non-critical file (ISO) download failures no longer prevent emulator startup
- The emulator boots to BIOS if the ISO fails to load
- Clear error messages guide users to import local ISO files
- Only critical files (BIOS, WASM) will prevent startup

## Testing in Production

When you have proper internet access (not in a sandbox), follow these steps to verify the fixes:

### Test 1: Verify No Preload Warnings
1. Start the server: `npm start`
2. Open browser DevTools (F12) and go to Console tab
3. Navigate to `http://localhost:8000`
4. **Expected:** No warnings about unused preloaded resources
5. **Expected:** Only see modulepreload for libv86.mjs

### Test 2: Test Proxy with Archive.org ISO
1. Select "TinyCore Linux 13.1" from the ISO dropdown
2. Click "Start"
3. **Expected:** ISO downloads through the proxy
4. **Expected:** Console shows "Proxying GET request to: https://archive.org/..."
5. **Expected:** If archive.org redirects, you'll see "Following redirect #X to: ..."
6. **Expected:** TinyCore Linux boots successfully

### Test 3: Test Fallback to BIOS
1. Select "None (Boot to BIOS)" from ISO dropdown
2. Click "Start"  
3. **Expected:** Emulator starts and shows SeaBIOS screen
4. **Expected:** Message "Booting from DVD/CD... Boot failed: Could not read from CDROM"
5. **Expected:** No bootable device message

### Test 4: Test Error Handling
To simulate a network error (only if you want to test error handling):
1. Temporarily block archive.org in your hosts file OR
2. Modify server.js to reject the domain for testing
3. Select an ISO and click Start
4. **Expected:** Emulator shows warning about ISO download failure
5. **Expected:** Emulator continues to boot to BIOS
6. **Expected:** User-friendly message: "Failed to download ISO ... The emulator will boot to BIOS."

## Server Logs

When the proxy is working correctly, you should see logs like:

```
Proxying GET request to: https://archive.org/download/tinycore-linux-13.1/TinyCore-13.1.iso
Following redirect #1 to: https://ia801404.us.archive.org/27/items/tinycore-linux-13.1/TinyCore-13.1.iso
```

If there's an error, you'll see:
```
Proxy request error: getaddrinfo ENOTFOUND archive.org
```

## Browser Console

### Normal Operation (No Errors)
- v86 library loads
- BIOS files load successfully  
- ISO loads through proxy
- "Emulator started successfully"

### ISO Download Failure (Graceful Degradation)
- "Warning: Failed to download ISO ... The emulator will boot to BIOS."
- "You can still use the emulator, or try importing a local ISO file."
- Emulator continues to run

### Critical Error (Blocks Startup)
- "Critical file download failed. Please refresh the page and try again."
- Start button re-enabled for retry

## Proxy Endpoint Details

The proxy accepts requests at: `/proxy?url=<encoded_url>`

### Security Features:
- Only allows archive.org and its subdomains
- Only allows GET and HEAD methods
- Follows redirects automatically (max 5)
- 30 second timeout
- Validates all URLs

### Supported Features:
- Range requests (for partial downloads)
- Proper CORS headers
- Content-Length and Accept-Ranges forwarding
- Streaming response (low memory usage)

## Common Issues and Solutions

### Issue: 502 Bad Gateway
**Cause:** Cannot reach archive.org (network issue)
**Solution:** Check internet connectivity, firewall rules, DNS resolution

### Issue: 504 Gateway Timeout  
**Cause:** Request took longer than 30 seconds
**Solution:** Increase PROXY_TIMEOUT_MS in server.js if needed

### Issue: 403 Forbidden
**Cause:** Trying to proxy a non-archive.org domain
**Solution:** This is intentional for security - only archive.org is allowed

### Issue: Too many redirects
**Cause:** More than 5 redirects in the chain
**Solution:** Increase MAX_REDIRECTS in server.js if legitimate

## Development Testing

If you're developing and want to test without internet access:
1. Place ISO files in `public/iso/` directory
2. Modify `index.html` to point to local files:
   ```html
   <option value="iso/your-file.iso">Your Local ISO</option>
   ```
3. No proxy needed for local files

## Performance Notes

- First download is slower (fetching from archive.org)
- Consider implementing caching for frequently used ISOs
- Range requests allow resumable downloads
- Streaming ensures low memory usage even for large ISOs
