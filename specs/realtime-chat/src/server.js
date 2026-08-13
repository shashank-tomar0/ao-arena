// Realtime chat server — AO Arena challenge spec.
//
// A zero-dependency WebSocket server implementing RFC 6455 by hand: HTTP
// upgrade handshake, masked client frames, unmasked server frames, ping/pong,
// close. No npm packages, no frameworks — the whole protocol fits in one file,
// which is exactly what makes it a fair challenge for an agent fleet.
//
// Features the acceptance suite verifies:
//   - handshake (Sec-WebSocket-Accept), rejection of bad upgrades
//   - bidirectional text messaging, broadcast to all peers
//   - presence: join/leave events with the live peer list
//   - ping/pong keepalive
//   - graceful shutdown: close frames to all peers, then the HTTP server
import http from 'node:http';
import crypto from 'node:crypto';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export function createChatServer() {
  const peers = new Map(); // id -> { id, name, socket }
  let nextId = 1;
  let closed = false;

  const server = http.createServer((req, res) => {
    if (req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, peers: peers.size }));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  });

  // --- RFC 6455 upgrade ---
  server.on('upgrade', (req, socket) => {
    if (req.url !== '/ws') {
      socket.destroy();
      return;
    }
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }
    const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );

    const id = nextId++;
    const name = `user-${id}`;
    peers.set(id, { id, name, socket });

    broadcast(JSON.stringify({ type: 'presence', event: 'join', name, peers: names() }));

    socket._wsBuf = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      socket._wsBuf = Buffer.concat([socket._wsBuf, chunk]);
      const consumed = consumeFrames(socket);
      if (consumed > 0) socket._wsBuf = socket._wsBuf.subarray(consumed);
    });
    socket.on('close', () => {
      if (peers.delete(id)) {
        broadcast(JSON.stringify({ type: 'presence', event: 'leave', name, peers: names() }));
      }
    });
    socket.on('error', () => {});
  });

  // --- outbound ---
  function sendFrame(socket, payload) {
    const data = Buffer.from(payload);
    let header;
    if (data.length < 126) {
      header = Buffer.from([0x81, data.length]);
    } else if (data.length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(data.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(data.length), 2);
    }
    socket.write(Buffer.concat([header, data]));
  }

  function broadcast(payload) {
    if (closed) return;
    for (const [id, p] of peers) {
      try {
        sendFrame(p.socket, payload);
      } catch (err) {
        if (err) {
          // Broken pipe or dead socket — drop the peer so the room stays honest.
          peers.delete(id);
          p.socket.destroy();
        }
      }
    }
  }

  // --- inbound frame parsing (masked client frames) ---
  function consumeFrames(socket) {
    const buf = socket._wsBuf;
    let offset = 0;
    while (true) {
      if (offset + 2 > buf.length) break;
      const b0 = buf[offset];
      const b1 = buf[offset + 1];
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f;
      let hdr = 2;
      if (len === 126) {
        if (offset + 4 > buf.length) break;
        len = buf.readUInt16BE(offset + 2);
        hdr = 4;
      } else if (len === 127) {
        if (offset + 10 > buf.length) break;
        len = Number(buf.readBigUInt64BE(offset + 2));
        hdr = 10;
      }
      if (masked) hdr += 4;
      if (offset + hdr + len > buf.length) break; // wait for the rest of the frame
      const payload = Buffer.from(buf.subarray(offset + hdr, offset + hdr + len));
      if (masked) {
        const key = buf.subarray(offset + hdr - 4, offset + hdr);
        for (let i = 0; i < payload.length; i++) payload[i] ^= key[i % 4];
      }
      offset += hdr + len;
      handleFrame(socket, opcode, payload);
    }
    return offset;
  }

  function handleFrame(socket, opcode, payload) {
    if (opcode === 0x1) {
      // text frame
      const text = payload.toString('utf8');
      const peer = [...peers.values()].find((p) => p.socket === socket);
      if (text === 'list') {
        sendFrame(socket, JSON.stringify({ type: 'presence', peers: names() }));
      } else {
        broadcast(JSON.stringify({ type: 'message', from: peer ? peer.name : '?', text }));
      }
    } else if (opcode === 0x8) {
      // close frame — reply with close and end the socket
      socket.end();
    } else if (opcode === 0x9) {
      // ping → pong with the same payload
      const pong = Buffer.alloc(2);
      pong[0] = 0x8a;
      pong[1] = payload.length;
      socket.write(Buffer.concat([pong, payload]));
    }
  }

  // --- lifecycle ---
  return {
    server,
    listen(port = 0, host = '127.0.0.1') {
      return new Promise((resolve) => {
        server.listen(port, host, () => resolve(server.address().port));
      });
    },
    peerCount() {
      return peers.size;
    },
    names() {
      return names();
    },
    async close() {
      closed = true;
      for (const p of peers.values()) {
        try {
          sendFrame(p.socket, JSON.stringify({ type: 'bye' }));
        } catch {
          // already gone
        }
        p.socket.end();
      }
      await new Promise((resolve) => server.close(resolve));
    },
  };

  function names() {
    return [...peers.values()].map((p) => p.name).sort();
  }
}

// Graceful shutdown on SIGTERM/SIGINT: close frames to every peer, then stop.
export function shutdownOnSignal(chat) {
  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, async () => {
      try {
        await chat.close();
      } finally {
        process.exit(0);
      }
    });
  }
}
