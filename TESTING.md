# Testing Guide for Network Relay Functionality

This guide explains how to test the network relay functionality in the V86 emulator.

## Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure you have an ISO file in `public/iso/` directory (or use the Import button)

## Testing the Network Relay Server

### 1. Start the Server

```bash
npm start
```

You should see output like:
```
╔═══════════════════════════════════════════════════════════╗
║         V86 Emulator Server with Network Relay          ║
╟───────────────────────────────────────────────────────────╢
║  HTTP Server:    http://localhost:8000                   ║
║  WebSocket URL:  ws://localhost:8000                     ║
║  Protocol:       WISP (Network Relay)                    ║
╚═══════════════════════════════════════════════════════════╝
```

### 2. Verify HTTP Server

Open a new terminal and test the HTTP server:

```bash
curl http://localhost:8000/
```

You should see HTML content from the index.html file.

### 3. Verify WebSocket Endpoint

Test that the WebSocket endpoint responds:

```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" \
  http://localhost:8000/
```

You should see a response indicating WebSocket handling (not a 404).

### 4. Test in Browser

1. Open your browser to: `http://localhost:8000`

2. **Verify Default Settings:**
   - Network Mode should be set to "Host Connection (Use Host Internet)"
   - Relay Server URL should show "ws://localhost:8000"
   - The Relay Server URL field should be visible

3. **Check Console Log:**
   - The console should show startup messages
   - No error messages about network configuration

4. **Test Network Configuration (Optional):**
   - Click the "Start" button to initialize the emulator
   - Wait for the ISO to load
   - Once the OS boots, you can test network connectivity from within the VM
   - For example, in SliTaz: `ping 8.8.8.8` or `wget http://example.com`

### 5. Test Different Network Modes

**Test WISP Server Mode:**
1. Change Network Mode to "WISP Server"
2. The WISP Server URL field should appear
3. Enter a WISP server URL (e.g., `ws://localhost:8001`)
4. Start a separate WISP server: `npm run wisp`
5. Click "Start" to test with WISP server

**Test No Network Mode:**
1. Change Network Mode to "None"
2. Both URL fields should be hidden
3. Click "Start" - the emulator should start without network

## Testing Server Scripts Individually

### Test Main Server (HTTP + Relay)
```bash
npm start
# or
node server.js
# or with custom port
node server.js 8080
```

### Test Relay Server Only
```bash
npm run relay
# or
node relay-server.js
# or with custom port
node relay-server.js 8080
```

### Test WISP Server Only
```bash
npm run wisp
# or
node wisp-server.js
# or with custom port
node wisp-server.js 8001
```

## Expected Behavior

### Default Configuration
- ✅ Network Mode: "Host Connection (Use Host Internet)" (selected by default)
- ✅ Relay Server URL: "ws://localhost:8000" (pre-filled and visible)
- ✅ Server starts successfully without errors
- ✅ WebSocket endpoint responds to upgrade requests
- ✅ Static files are served correctly

### Error Cases to Test

1. **Port Already in Use:**
   ```bash
   npm start
   # In another terminal
   npm start  # Should fail with EADDRINUSE error
   ```

2. **Invalid WebSocket URL:**
   - Enter an invalid URL (e.g., "not-a-url")
   - Click "Start"
   - Should see error in console log

3. **Wrong Protocol:**
   - Enter HTTP URL instead of WebSocket (e.g., "http://localhost:8000")
   - Click "Start"
   - Should see validation error

## Troubleshooting

### Server Won't Start
- **Error: EADDRINUSE** - Port is already in use
  - Solution: Use a different port: `node server.js 8080`
  - Or kill the process using the port: `pkill -f "node server.js"`

### WebSocket Connection Fails
- Check that the server is running
- Verify the URL starts with `ws://` or `wss://`
- Check browser console for error messages
- Ensure firewall isn't blocking the connection

### Network Not Working in VM
- Verify the relay server is running
- Check that network mode is set correctly
- Some ISOs may require additional network configuration inside the OS
- Try using a different ISO to verify functionality

## Success Criteria

✅ All tests pass with the following verified:
1. Server starts without errors
2. HTTP server serves files correctly
3. WebSocket endpoint is available
4. Default network mode is "Host Connection"
5. Default relay URL is "ws://localhost:8000"
6. UI displays network settings correctly
7. Emulator can be started with network enabled
8. No console errors related to network configuration

## Additional Testing

For comprehensive testing, consider:
- Testing on different browsers (Chrome, Firefox, Safari)
- Testing with different operating systems (Windows, macOS, Linux)
- Testing with different ISOs
- Load testing the relay server with multiple connections
- Testing network connectivity from within the booted OS
