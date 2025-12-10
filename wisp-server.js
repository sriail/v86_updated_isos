#!/usr/bin/env node
/**
 * WISP Server for V86 Emulator
 * 
 * This server provides WebSocket proxy functionality for the v86 emulator
 * using the WISP protocol (WebSocket over Internet Streaming Protocol).
 * 
 * Usage: node wisp-server.js [port]
 * Default port: 8001
 */

const http = require('http');
const { Server: WispServer } = require('@mercuryworkshop/wisp-js');

const PORT = process.env.WISP_PORT || parseInt(process.argv[2]) || 8001;
const HOST = process.env.WISP_HOST || '0.0.0.0';

// Create HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WISP Server running. Connect via WebSocket.\n');
});

// Create WISP server instance
const wispServer = new WispServer({
    server: server,
});

// Start the server
server.listen(PORT, HOST, () => {
    console.log(`╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║         V86 WISP Server Started                          ║`);
    console.log(`╟───────────────────────────────────────────────────────────╢`);
    console.log(`║  WebSocket URL: ws://localhost:${PORT}                      ║`);
    console.log(`║  Protocol: WISP (WebSocket Internet Streaming Protocol)  ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝`);
    console.log(``);
    console.log(`To use this server with v86:`);
    console.log(`1. Select "WISP Server" network mode in the UI`);
    console.log(`2. Set WISP Server URL to: ws://localhost:${PORT}`);
    console.log(`3. Start the emulator`);
    console.log(``);
    console.log(`Press Ctrl+C to stop the server`);
    console.log(``);
});

// Handle errors
server.on('error', (err) => {
    console.error(`Server error: ${err.message}`);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down WISP server...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n\nShutting down WISP server...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});
