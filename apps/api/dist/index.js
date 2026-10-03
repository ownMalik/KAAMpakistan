"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_express2 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_helmet = __toESM(require("helmet"));
var import_dotenv = __toESM(require("dotenv"));
var import_http = __toESM(require("http"));
var import_socket = require("socket.io");
var import_express_rate_limit = __toESM(require("express-rate-limit"));

// src/routes/auth.routes.ts
var import_express = require("express");

// src/config/prisma.ts
var import_client = require("@prisma/client");
var prismaClientSingleton = () => {
  return new import_client.PrismaClient();
};
var prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
var prisma_default = prisma;

// src/controllers/auth.controller.ts
var import_bcrypt = __toESM(require("bcrypt"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var generateTokens = (user) => {
  const accessToken = import_jsonwebtoken.default.sign(
    { id: user.id, role: user.role, phone: user.phone },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "15m" }
  );
  const refreshToken = import_jsonwebtoken.default.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || "refresh_secret",
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};
var register = async (req, res) => {
  try {
    const { phone, email, password, fullName, city, area, role } = req.body;
    if (!phone || !password || !fullName) {
      return res.status(400).json({ error: "Phone, password, and full name are required." });
    }
    const existingUser = await prisma_default.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: "User with this phone number already exists." });
    }
    const hashedPassword = await import_bcrypt.default.hash(password, 10);
    const user = await prisma_default.user.create({
      data: {
        phone,
        email,
        passwordHash: hashedPassword,
        fullName,
        city,
        area,
        role: role === "PROVIDER" ? "PROVIDER" : "CUSTOMER"
      }
    });
    if (user.role === "PROVIDER") {
      await prisma_default.providerProfile.create({
        data: {
          userId: user.id
        }
      });
    }
    const tokens = generateTokens(user);
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        city: user.city
      },
      ...tokens
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ error: "Internal server error during registration." });
  }
};
var login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required." });
    }
    const user = await prisma_default.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: "Invalid phone number or password." });
    }
    const isPasswordValid = await import_bcrypt.default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid phone number or password." });
    }
    const tokens = generateTokens(user);
    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        city: user.city
      },
      ...tokens
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Internal server error during login." });
  }
};

// src/routes/auth.routes.ts
var router = (0, import_express.Router)();
router.post("/register", register);
router.post("/login", login);
var auth_routes_default = router;

// src/index.ts
import_dotenv.default.config();
var app = (0, import_express2.default)();
var server = import_http.default.createServer(app);
var allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http://localhost:3000"];
var io = new import_socket.Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.use((0, import_helmet.default)());
app.use((0, import_cors.default)({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
var limiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use("/api/", limiter);
app.use(import_express2.default.json({ limit: "10mb" }));
app.use("/api/auth", auth_routes_default);
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "KAAM PAKISTAN API", environment: process.env.NODE_ENV });
});
io.on("connection", (socket) => {
  console.log(`Secure client connected: ${socket.id}`);
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
  });
  socket.on("send_message", (data) => {
    io.to(data.conversationId).emit("receive_message", data);
  });
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});
var PORT = process.env.PORT || 5e3;
server.listen(PORT, () => {
  console.log(`KAAM PAKISTAN Production API running on port ${PORT}`);
});
