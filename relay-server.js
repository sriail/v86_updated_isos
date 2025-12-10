#!/usr/bin/env node
/**
 * Network Relay Server for V86 Emulator
 * 
 * This server provides both:
 * 1. Static file serving for the web interface
 * 2. Network relay functionality via WISP protocol
 * 
 * Usage: node relay-server.js [port]
 * Default port: 8000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { server: wisp } = require('@mercuryworkshop/wisp-js/server');

const PORT = process.env.PORT || parseInt(process.argv[2]) || 8000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for common files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm',
    '.bin': 'application/octet-stream',
    '.iso': 'application/octet-stream',
    '.img': 'application/octet-stream',
};

// Create HTTP server
const server = http.createServer((req, res) => {
    // Parse URL
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Security: prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    // Get file extension
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // Read and serve file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            // Success
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin'
            });
            res.end(content, 'utf-8');
        }
    });
});

// Handle WebSocket upgrades for WISP network relay
server.on('upgrade', (req, socket, head) => {
    wisp.routeRequest(req, socket, head);
});

// Start the server
server.listen(PORT, HOST, () => {
    console.log(`╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║    V86 Emulator - Network Relay Server                   ║`);
    console.log(`╟───────────────────────────────────────────────────────────╢`);
    console.log(`║  HTTP Server:    http://localhost:${PORT}                   ║`);
    console.log(`║  WebSocket URL:  ws://localhost:${PORT}                     ║`);
    console.log(`║  Protocol:       WISP (Network Relay)                    ║`);
    console.log(`║  Public Dir:     ${PUBLIC_DIR.substring(0, 40).padEnd(40)} ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝`);
    console.log(``);
    console.log(`✓ Server ready!`);
    console.log(``);
    console.log(`Open your browser to: http://localhost:${PORT}`);
    console.log(``);
    console.log(`The emulator is pre-configured to use network relay.`);
    console.log(`Just click "Start" to begin emulation with network enabled.`);
    console.log(``);
    console.log(`Press Ctrl+C to stop the server`);
    console.log(``);
});

// Handle errors
server.on('error', (err) => {
    console.error(`Server error: ${err.message}`);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        console.error(`Try running with a different port: node relay-server.js 8080`);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down relay server...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n\nShutting down relay server...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});
