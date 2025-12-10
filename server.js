#!/usr/bin/env node
/**
 * V86 Emulator Complete Server
 * 
 * This is the main server that provides everything needed to run v86:
 * 1. Static file serving for the web interface
 * 2. Network relay functionality via WISP protocol (default)
 * 
 * Usage: npm start
 * Or: node server.js [port]
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
            // Binary files should not have encoding specified
            res.end(content);
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
    console.log(`║         V86 Emulator Server with Network Relay          ║`);
    console.log(`╟───────────────────────────────────────────────────────────╢`);
    console.log(`║  HTTP Server:    http://localhost:${PORT}                   ║`);
    console.log(`║  WebSocket URL:  ws://localhost:${PORT}                     ║`);
    console.log(`║  Protocol:       WISP (Network Relay)                    ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝`);
    console.log(``);
    console.log(`✓ Server is running!`);
    console.log(``);
    console.log(`📖 Quick Start:`);
    console.log(`   1. Open your browser to: http://localhost:${PORT}`);
    console.log(`   2. The network relay is already configured as default`);
    console.log(`   3. Click "Start" to begin emulation with network enabled`);
    console.log(``);
    console.log(`📡 Network Configuration:`);
    console.log(`   - Default mode: Host Connection (Network Relay)`);
    console.log(`   - Relay URL: ws://localhost:${PORT}`);
    console.log(`   - Change network settings in the UI if needed`);
    console.log(``);
    console.log(`Press Ctrl+C to stop the server`);
    console.log(``);
});

// Handle errors
server.on('error', (err) => {
    console.error(`❌ Server error: ${err.message}`);
    if (err.code === 'EADDRINUSE') {
        console.error(`   Port ${PORT} is already in use.`);
        console.error(`   Try running with a different port: npm start -- 8080`);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✓ Server stopped.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✓ Server stopped.');
        process.exit(0);
    });
});
