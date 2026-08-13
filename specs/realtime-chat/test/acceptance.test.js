// Acceptance suite for the realtime-chat spec.
//
// These tests exercise the server through the real WebSocket protocol:
// handshake, masked client frames, broadcast, presence, ping/pong, and
// graceful shutdown. The negative cases (missing key, wrong path) are the
// ones that keep the mutation differential honest — flip a guard and these
// tests must fail.
import { test, before, after } from 'node:test';
import assert from 'node:assert';
import net from 'node:net';
import { createChatServer } from '../src/server.js';

let chat;
let port;

// Every client the tests open is registered here so the top-level after
// hook can force-close them — even when a mutant breaks a test mid-flight.
// A leaked socket keeps the node process alive and hangs CI forever.
const open = new Set();

before(async () => {
  chat = createChatServer();
  port = await chat.listen(0);
});

after(async () => {
  await chat.close();
  for (const c of open) {
    try {
      if (c.close) await Promise.race([c.close(), new Promise((r) => setTimeout(r, 800))]);
      else c.destroy();
    } catch {
      // already gone
    }
  }
  open.clear();
});

const WS_KEY = 'dGhlIHNhbXBsZSBub25jZQ==';

// connect returns a tiny WebSocket client with a message queue.
function connect() {
  return new Promise((resolve, reject) => {
    const s = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const inbox = [];
    const waiters = [];
    // The very first frame every client receives is its own join broadcast;
    // drop it from the stream but capture the client's assigned name.
    let first = true;
    let myName = null;
    s.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (first) {
        first = false;
        if (msg.type === 'presence' && msg.event === 'join') myName = msg.name;
        return;
      }
      const w = waiters.shift();
      if (w) w(msg);
      else inbox.push(msg);
    };
    s.onerror = () => reject(new Error('websocket error'));
    s.onopen = () => {
      const client = {
        s,
        name: () => myName,
        close() {
          return new Promise((res) => {
            if (s.readyState === WebSocket.CLOSED || s.readyState === WebSocket.CLOSING) return res();
            s.onclose = () => {
              open.delete(client);
              res();
            };
            s.close();
          });
        },
        next(timeout = 3000) {
          return new Promise((res, rej) => {
            if (inbox.length) return res(inbox.shift());
            const t = setTimeout(() => rej(new Error('timed out waiting for message')), timeout);
            waiters.push((m) => {
              clearTimeout(t);
              res(m);
            });
          });
        },
      };
      open.add(client);
      resolve(client);
    };
  });
}

// rawUpgrade opens a raw TCP connection and performs a manual RFC 6455
// handshake, returning the socket plus helpers to read server frames.
function rawUpgrade({ path = '/ws', key = WS_KEY } = {}) {
  return new Promise((resolve, reject) => {
    const s = net.connect(port, '127.0.0.1');
    const inbox = [];
    const waiters = [];
    let buf = Buffer.alloc(0);
    let handshaken = false;

    s.on('error', () => {});
    const reg = { s, destroy: () => s.destroy() };
    open.add(reg);
    s.on('close', () => open.delete(reg));
    s.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      if (!handshaken) {
        const idx = buf.indexOf('\r\n\r\n');
        if (idx >= 0) {
          handshaken = true;
          buf = buf.subarray(idx + 4);
        } else {
          return;
        }
      }
      // parse unmasked server frames
      while (buf.length >= 2) {
        const b0 = buf[0];
        const b1 = buf[1];
        const opcode = b0 & 0x0f;
        let len = b1 & 0x7f;
        let hdr = 2;
        if (len === 126) {
          if (buf.length < 4) break;
          len = buf.readUInt16BE(2);
          hdr = 4;
        } else if (len === 127) {
          if (buf.length < 10) break;
          len = Number(buf.readBigUInt64BE(2));
          hdr = 10;
        }
        if (buf.length < hdr + len) break;
        const payload = buf.subarray(hdr, hdr + len).toString('utf8');
        buf = buf.subarray(hdr + len);
        const w = waiters.shift();
        if (w) w({ opcode, payload });
        else inbox.push({ opcode, payload });
      }
    });

    const upgrade = `GET ${path} HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`;
    s.write(upgrade);

    const deadline = setTimeout(() => reject(new Error('raw upgrade timed out')), 3000);
    const poll = setInterval(() => {
      if (handshaken) {
        clearInterval(poll);
        clearTimeout(deadline);
        resolve({
          s,
          next(timeout = 3000) {
            return new Promise((res, rej) => {
              if (inbox.length) return res(inbox.shift());
              const t = setTimeout(() => rej(new Error('timed out waiting for frame')), timeout);
              waiters.push((f) => {
                clearTimeout(t);
                res(f);
              });
            });
          },
        });
      }
    }, 10);
  });
}

// sendMasked writes one masked text (or given-opcode) frame to a raw socket.
function sendMasked(s, payload, opcode = 0x1) {
  const data = Buffer.from(payload);
  const mask = Buffer.from([1, 2, 3, 4]);
  const masked = Buffer.from(data);
  for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i % 4];
  let header;
  if (data.length < 126) {
    header = Buffer.from([0x80 | opcode, 0x80 | data.length]);
  } else {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(data.length, 2);
  }
  s.write(Buffer.concat([header, mask, masked]));
}

test('health endpoint reports the server is alive', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/healthz`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.ok, true);
  assert.strictEqual(typeof body.peers, 'number');
});

test('handshake completes and clients join presence', async () => {
  const a = await connect();
  const b = await connect();

  // A hears B join, with the live peer list.
  const join = await a.next();
  assert.strictEqual(join.type, 'presence');
  assert.strictEqual(join.event, 'join');
  assert.strictEqual(join.name, b.name());
  assert.deepStrictEqual([...join.peers].sort(), [a.name(), b.name()].sort());

  await a.close();
  await b.close();
});

test('messages broadcast to every peer with the sender name', async () => {
  const a = await connect();
  const b = await connect();
  await a.next(); // consume B's join

  a.s.send('hello arena');
  const onA = await a.next();
  const onB = await b.next();
  assert.strictEqual(onA.type, 'message');
  assert.strictEqual(onA.from, a.name());
  assert.strictEqual(onA.text, 'hello arena');
  assert.deepStrictEqual(onB, onA);

  b.s.send('second speaker');
  const fromB = await b.next();
  assert.strictEqual(fromB.from, b.name());
  assert.strictEqual(fromB.text, 'second speaker');

  await a.close();
  await b.close();
});

test('a peer leaving is broadcast with the remaining roster', async () => {
  const a = await connect();
  const b = await connect();
  await a.next(); // B's join

  await b.close();
  const leave = await a.next();
  assert.strictEqual(leave.type, 'presence');
  assert.strictEqual(leave.event, 'leave');
  assert.strictEqual(leave.name, b.name());
  assert.deepStrictEqual(leave.peers, [a.name()]);

  await a.close();
});

test('list command returns the live roster', async () => {
  const a = await connect();
  const b = await connect();
  await a.next(); // B's join

  a.s.send('list');
  const listed = await a.next();
  assert.strictEqual(listed.type, 'presence');
  assert.deepStrictEqual([...listed.peers].sort(), [a.name(), b.name()].sort());

  await a.close();
  await b.close();
});

test('ping is answered with a pong carrying the same payload', async () => {
  const raw = await rawUpgrade();
  try {
    // The raw client also hears its own join broadcast first — drain it.
    const join = await raw.next();
    assert.strictEqual(join.opcode, 0x1);
    assert.ok(join.payload.includes('join'));

    sendMasked(raw.s, 'hi', 0x9); // ping
    const pong = await raw.next();
    assert.strictEqual(pong.opcode, 0xa);
    assert.strictEqual(pong.payload, 'hi');
  } finally {
    raw.s.destroy();
  }
});

test('upgrade without a Sec-WebSocket-Key is rejected', async () => {
  const s = net.connect(port, '127.0.0.1');
  try {
    const closed = new Promise((res) => s.once('close', res));
    s.write(
      'GET /ws HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n'
    );
    await Promise.race([closed, new Promise((_, rej) => setTimeout(() => rej(new Error('server accepted a keyless upgrade')), 2000))]);
  } finally {
    s.destroy();
  }
});

test('upgrade to a non-/ws path is rejected', async () => {
  const s = net.connect(port, '127.0.0.1');
  try {
    const closed = new Promise((res) => s.once('close', res));
    s.write(
      `GET /other HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${WS_KEY}\r\nSec-WebSocket-Version: 13\r\n\r\n`
    );
    await Promise.race([closed, new Promise((_, rej) => setTimeout(() => rej(new Error('server accepted an upgrade to the wrong path')), 2000))]);
  } finally {
    s.destroy();
  }
});

test('graceful shutdown closes every peer', async () => {
  const chat2 = createChatServer();
  const port2 = await chat2.listen(0);
  const c = await new Promise((resolve, reject) => {
    const s = new WebSocket(`ws://127.0.0.1:${port2}/ws`);
    s.onerror = () => reject(new Error('ws error'));
    s.onopen = () => resolve(s);
  });

  const gotBye = new Promise((res) => {
    c.onmessage = (ev) => {
      if (ev.data.includes('bye')) res();
    };
  });
  await chat2.close();
  await Promise.race([gotBye, new Promise((_, rej) => setTimeout(() => rej(new Error('no bye frame before shutdown')), 2000))]);
});
