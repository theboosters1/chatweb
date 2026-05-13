# Cryptoverse - Secure E2EE Real-Time Chat

Cryptoverse is a lightweight, privacy-focused, real-time chatting platform built for private communication. It operates with zero persistence—messages exist only in server memory and are destroyed when the session ends.

## Features

- **End-to-End Encryption (E2EE)**: All messages are encrypted with AES-256 on the client side before transmission. The server never sees your plain-text messages or your room secret.
- **Zero Database**: No database is used. All chat data and sessions exist temporarily in-memory.
- **Anonymous**: No accounts or persistent IDs. Choose a temporary name and enter a room.
- **Room-Based Isolation**: Secure private rooms with custom IDs and secrets.
- **Real-Time**: Powered by Socket.IO for instant messaging, typing indicators, and presence tracking.
- **Modern UI**: Dark-themed glassmorphism design, fully responsive for mobile and desktop.

## Security

1. **Client-Side Encryption**: Your room "Secret" serves as the AES key. It stays in your browser.
2. **Server Blindness**: The Node.js server acts only as a relay for encrypted payloads.
3. **Temporal Storage**: Messages vanish if the server restarts or if all users leave the room.
4. **Helmet.js**: Enhanced security headers to prevent XSS and clickjacking.
5. **Rate Limiting**: Protection against spam and brute-force room discovery.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Motion, Lucide Icons, CryptoJS
- **Backend**: Node.js, Express, Socket.IO, Helmet, Express Rate Limit
- **Communication**: WebSockets

## How to used

1. Enter an **Anonymous Name**.
2. Enter a **Room ID** (or create a new random one).
3. Enter a **Room Secret**. This is the most important part—share this secret *only* with the people you want to chat with.
4. Start chatting securely.

---
*Note: Since this app uses in-memory storage, all room data is lost if the server process restarts (e.g., during a new deployment).*
