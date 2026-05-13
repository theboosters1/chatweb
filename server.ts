import express from "express";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "connect-src": ["'self'", "ws:", "wss:"],
      },
    },
  }));
  app.use(cors());
  app.use(express.json());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later."
  });
  app.use("/api", limiter);

  // Socket.IO Setup with explicit transports
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ["polling", "websocket"]
  });

  // In-memory room tracking (ephemeral)
  const rooms = new Map<string, Set<string>>(); // roomId -> Set of socketIds
  const userNames = new Map<string, string>(); // socketId -> userName

  io.on("connection", (socket) => {
    console.log("Connect attempt:", socket.id);

    socket.on("join-room", ({ roomId, userName }) => {
      console.log(`Join Room Request: ${userName} -> ${roomId}`);
      if (!roomId || !userName) return;

      socket.join(roomId);
      userNames.set(socket.id, userName);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)!.add(socket.id);

      // Notify others
      io.to(roomId).emit("user-joined", {
        userId: socket.id,
        userName,
        timestamp: Date.now()
      });

      // Send current users list back to the joiner
      const currentUsers = Array.from(rooms.get(roomId)!).map(id => ({
        userId: id,
        userName: userNames.get(id) || "Anonymous"
      }));
      
      socket.emit("room-data", {
        users: currentUsers
      });
    });

    socket.on("send-message", ({ roomId, encryptedData }) => {
      console.log(`Message in ${roomId} from ${socket.id}`);
      if (!roomId || !encryptedData) return;
      
      io.to(roomId).emit("receive-message", {
        senderId: socket.id,
        senderName: userNames.get(socket.id) || "Anonymous",
        encryptedData,
        timestamp: Date.now()
      });
    });

    socket.on("typing", ({ roomId, isTyping }) => {
      socket.to(roomId).emit("user-typing", {
        userId: socket.id,
        userName: userNames.get(socket.id) || "Anonymous",
        isTyping
      });
    });

    socket.on("disconnecting", () => {
      socket.rooms.forEach(roomId => {
        if (rooms.has(roomId)) {
          rooms.get(roomId)!.delete(socket.id);
          if (rooms.get(roomId)!.size === 0) {
            rooms.delete(roomId);
          } else {
            socket.to(roomId).emit("user-left", {
              userId: socket.id,
              userName: userNames.get(socket.id) || "Anonymous",
              timestamp: Date.now()
            });
          }
        }
      });
    });

    socket.on("disconnect", () => {
      userNames.delete(socket.id);
      console.log("User disconnected:", socket.id);
    });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", usersConnected: io.engine.clientsCount });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
