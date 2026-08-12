# Spec: Real-time Chat

Build a minimal real-time chat server over WebSockets with presence.

## Acceptance criteria

- [ ] WebSocket endpoint handshakes and echoes a client's messages back within 100ms
- [ ] Two connected clients can exchange messages (one sends, other receives)
- [ ] Presence: join/leave events broadcast to all connected clients
- [ ] At least one test proves bidirectional messaging
- [ ] Server handles a disconnect gracefully without crashing
- [ ] Graceful shutdown on SIGTERM

## Constraints

- Stack is your choice; no external SaaS (no Firebase, no Pusher)
- Must run with a single command in a fresh checkout: `npm run dev` or `go run .`

## Verifier notes

Proof required for each claim. The referee checks claim-vs-diff and symbol-reality
against the delivered repo — every acceptance criterion must map to code + a test.