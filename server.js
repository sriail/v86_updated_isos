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
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
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
    // Handle CORS proxy requests for external ISOs
    if (req.url.startsWith('/proxy?url=')) {
        const urlParam = req.url.substring('/proxy?url='.length);
        const targetUrl = decodeURIComponent(urlParam);
        
        // Validate URL is from allowed domains (archive.org)
        try {
            const parsedUrl = new URL(targetUrl);
            // Only allow archive.org and its subdomains (e.g., ia801404.us.archive.org)
            const hostname = parsedUrl.hostname;
            const isAllowed = hostname === 'archive.org' || hostname.endsWith('.archive.org');
            
            if (!isAllowed) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end('Proxy is only allowed for archive.org domains');
                return;
            }
            
            console.log(`Proxying request to: ${targetUrl}`);
            
            // Forward the range header if present
            const headers = {};
            if (req.headers.range) {
                headers.Range = req.headers.range;
            }
            
            // Make request to target URL
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            const proxyReq = protocol.get(targetUrl, { headers }, (proxyRes) => {
                // Forward status code and headers
                const responseHeaders = {
                    'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                    'Access-Control-Allow-Headers': 'Range',
                    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
                };
                
                // Forward important headers
                if (proxyRes.headers['content-length']) {
                    responseHeaders['Content-Length'] = proxyRes.headers['content-length'];
                }
                if (proxyRes.headers['content-range']) {
                    responseHeaders['Content-Range'] = proxyRes.headers['content-range'];
                }
                if (proxyRes.headers['accept-ranges']) {
                    responseHeaders['Accept-Ranges'] = proxyRes.headers['accept-ranges'];
                }
                
                res.writeHead(proxyRes.statusCode, responseHeaders);
                proxyRes.pipe(res);
            });
            
            // Set timeout on the request
            proxyReq.setTimeout(30000, () => {
                console.error('Proxy request timeout');
                proxyReq.destroy();
                if (!res.headersSent) {
                    res.writeHead(504, { 'Content-Type': 'text/plain' });
                    res.end('Proxy request timeout');
                }
            });
            
            proxyReq.on('error', (error) => {
                console.error(`Proxy error: ${error.message}`);
                if (!res.headersSent) {
                    res.writeHead(502, { 'Content-Type': 'text/plain' });
                    res.end('Proxy request failed');
                }
            });
            
            return;
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid URL');
            return;
        }
    }
    
    // Handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }
    
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

    // Get file stats first to support Range requests
    fs.stat(filePath, (statError, stats) => {
        if (statError) {
            if (statError.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${statError.code}`, 'utf-8');
            }
            return;
        }

        // Check if this is a directory
        if (stats.isDirectory()) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }

        const fileSize = stats.size;
        const rangeHeader = req.headers.range;

        // Handle Range requests
        if (rangeHeader) {
            const parts = rangeHeader.replace(/bytes=/, '').split('-');
            
            // Validate range header format
            if (parts.length !== 2) {
                res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
                res.end('Invalid Range header format');
                return;
            }
            
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            
            // Validate range values
            if (isNaN(start) || isNaN(end) || start < 0 || end < 0 || start > end || start >= fileSize) {
                res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
                res.end('Invalid Range values');
                return;
            }
            
            // Clamp end to file size
            const validEnd = Math.min(end, fileSize - 1);
            const chunkSize = (validEnd - start) + 1;

            // Read only the requested range
            const fileStream = fs.createReadStream(filePath, { start, end: validEnd });
            
            // Handle stream errors
            fileStream.on('error', (streamError) => {
                console.error(`Error reading file stream: ${streamError.message}`);
                if (!res.headersSent) {
                    res.writeHead(500);
                    res.end('Error reading file');
                }
            });
            
            res.writeHead(206, {
                'Content-Type': contentType,
                'Content-Length': chunkSize,
                'Content-Range': `bytes ${start}-${validEnd}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Access-Control-Allow-Origin': '*',
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin'
            });
            
            fileStream.pipe(res);
        } else {
            // Normal request - read entire file
            fs.readFile(filePath, (error, content) => {
                if (error) {
                    res.writeHead(500);
                    res.end(`Server Error: ${error.code}`, 'utf-8');
                } else {
                    res.writeHead(200, { 
                        'Content-Type': contentType,
                        'Content-Length': content.length,
                        'Accept-Ranges': 'bytes',
                        'Access-Control-Allow-Origin': '*',
                        'Cross-Origin-Embedder-Policy': 'require-corp',
                        'Cross-Origin-Opener-Policy': 'same-origin'
                    });
                    res.end(content);
                }
            });
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
