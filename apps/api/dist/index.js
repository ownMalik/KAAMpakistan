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
var import_express10 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_helmet = __toESM(require("helmet"));
var import_dotenv = __toESM(require("dotenv"));
var import_http = __toESM(require("http"));
var import_socket = require("socket.io");

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

// src/routes/search.routes.ts
var import_express2 = require("express");

// src/controllers/search.controller.ts
var searchProviders = async (req, res) => {
  try {
    const {
      query,
      // text search (name, bio, service name)
      categoryId,
      subcategoryId,
      serviceId,
      city,
      area,
      minRating,
      maxPrice,
      minExperience,
      isAvailable,
      sortBy = "rating",
      // rating, price_low, experience, newest, reviews
      page = "1",
      limit = "10"
    } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const whereClause = {
      isVerified: true
    };
    if (city || area || query) {
      whereClause.user = {};
      if (city) {
        whereClause.user.city = { equals: city, mode: "insensitive" };
      }
      if (area) {
        whereClause.user.area = { equals: area, mode: "insensitive" };
      }
    }
    const orConditions = [];
    if (query) {
      orConditions.push(
        { user: { fullName: { contains: query, mode: "insensitive" } } },
        { bio: { contains: query, mode: "insensitive" } },
        {
          skills: {
            some: {
              service: {
                name: { contains: query, mode: "insensitive" }
              }
            }
          }
        }
      );
    }
    if (orConditions.length > 0) {
      whereClause.OR = orConditions;
    }
    if (serviceId) {
      whereClause.skills = {
        some: { serviceId }
      };
    } else if (subcategoryId) {
      whereClause.skills = {
        some: {
          service: {
            subcategoryId
          }
        }
      };
    } else if (categoryId) {
      whereClause.skills = {
        some: {
          service: {
            subcategory: {
              categoryId
            }
          }
        }
      };
    }
    if (minRating) {
      whereClause.ratingAvg = { gte: parseFloat(minRating) };
    }
    if (minExperience) {
      whereClause.experienceYears = { gte: parseInt(minExperience, 10) };
    }
    if (isAvailable === "true") {
      whereClause.isAvailable = true;
    }
    let orderBy = { ratingAvg: "desc" };
    if (sortBy === "price_low") {
      orderBy = { startingPrice: "asc" };
    } else if (sortBy === "experience") {
      orderBy = { experienceYears: "desc" };
    } else if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "reviews") {
      orderBy = { reviewCount: "desc" };
    }
    const [providers, total] = await Promise.all([
      prisma_default.providerProfile.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              fullName: true,
              phone: true,
              avatarUrl: true,
              city: true,
              area: true
            }
          },
          skills: {
            include: {
              service: true
            }
          },
          serviceAreas: {
            include: {
              area: true
            }
          }
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma_default.providerProfile.count({ where: whereClause })
    ]);
    return res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      providers
    });
  } catch (error) {
    console.error("Search Error:", error);
    return res.status(500).json({ error: "Internal server error during search." });
  }
};

// src/routes/search.routes.ts
var router2 = (0, import_express2.Router)();
router2.get("/providers", searchProviders);
var search_routes_default = router2;

// src/routes/request.routes.ts
var import_express3 = require("express");

// src/middleware/auth.middleware.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token missing or malformed" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = import_jsonwebtoken2.default.verify(token, process.env.JWT_SECRET || "secret");
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
var requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized access for this role" });
    }
    next();
  };
};

// src/controllers/request.controller.ts
var createServiceRequest = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { providerId, serviceNeeded, description, scheduledDate, location } = req.body;
    if (!providerId || !serviceNeeded || !location) {
      return res.status(400).json({ error: "Provider ID, service needed, and location are required." });
    }
    const provider = await prisma_default.providerProfile.findUnique({ where: { id: providerId } });
    if (!provider) {
      return res.status(404).json({ error: "Service provider not found." });
    }
    const serviceRequest = await prisma_default.serviceRequest.create({
      data: {
        customerId,
        providerId,
        serviceNeeded,
        description,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        location,
        status: "PENDING"
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        provider: { include: { user: { select: { fullName: true, phone: true } } } }
      }
    });
    await prisma_default.conversation.create({
      data: {
        serviceRequestId: serviceRequest.id
      }
    });
    return res.status(201).json({
      message: "Service request sent successfully.",
      serviceRequest
    });
  } catch (error) {
    console.error("Create Request Error:", error);
    return res.status(500).json({ error: "Internal server error while creating service request." });
  }
};
var getMyRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    let requests;
    if (role === "PROVIDER") {
      const providerProfile = await prisma_default.providerProfile.findUnique({ where: { userId } });
      if (!providerProfile) return res.status(404).json({ error: "Provider profile not found." });
      requests = await prisma_default.serviceRequest.findMany({
        where: { providerId: providerProfile.id },
        include: {
          customer: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
          agreement: true,
          conversation: true
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      requests = await prisma_default.serviceRequest.findMany({
        where: { customerId: userId },
        include: {
          provider: { include: { user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } } } },
          agreement: true,
          conversation: true
        },
        orderBy: { createdAt: "desc" }
      });
    }
    return res.json({ requests });
  } catch (error) {
    console.error("Get Requests Error:", error);
    return res.status(500).json({ error: "Internal server error while fetching requests." });
  }
};
var updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const request = await prisma_default.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ error: "Service request not found." });
    const updated = await prisma_default.serviceRequest.update({
      where: { id: requestId },
      data: { status }
    });
    return res.json({ message: "Request status updated", request: updated });
  } catch (error) {
    console.error("Update Request Error:", error);
    return res.status(500).json({ error: "Internal server error while updating request." });
  }
};
var createAgreement = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { agreedPrice, agreedDate, duration } = req.body;
    const request = await prisma_default.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ error: "Service request not found." });
    const agreement = await prisma_default.agreement.upsert({
      where: { serviceRequestId: requestId },
      update: {
        agreedPrice,
        agreedDate: new Date(agreedDate),
        duration
      },
      create: {
        serviceRequestId: requestId,
        agreedPrice,
        agreedDate: new Date(agreedDate),
        duration
      }
    });
    await prisma_default.serviceRequest.update({
      where: { id: requestId },
      data: { status: "AGREED" }
    });
    return res.json({ message: "Price and terms agreement created", agreement });
  } catch (error) {
    console.error("Agreement Error:", error);
    return res.status(500).json({ error: "Internal server error while creating agreement." });
  }
};

// src/routes/request.routes.ts
var router3 = (0, import_express3.Router)();
router3.post("/", authenticate, createServiceRequest);
router3.get("/", authenticate, getMyRequests);
router3.patch("/:requestId/status", authenticate, updateRequestStatus);
router3.post("/:requestId/agreement", authenticate, createAgreement);
var request_routes_default = router3;

// src/routes/message.routes.ts
var import_express4 = require("express");

// src/controllers/message.controller.ts
var getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await prisma_default.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" }
    });
    return res.json({ messages });
  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(500).json({ error: "Internal server error while fetching messages." });
  }
};
var sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.id;
    const { conversationId, content } = req.body;
    if (!conversationId || !content) {
      return res.status(400).json({ error: "Conversation ID and content are required." });
    }
    const message = await prisma_default.message.create({
      data: {
        conversationId,
        senderId,
        content
      },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } }
    });
    return res.status(201).json({ message });
  } catch (error) {
    console.error("Send Message Error:", error);
    return res.status(500).json({ error: "Internal server error while sending message." });
  }
};

// src/routes/message.routes.ts
var router4 = (0, import_express4.Router)();
router4.get("/:conversationId", authenticate, getConversationMessages);
router4.post("/", authenticate, sendMessage);
var message_routes_default = router4;

// src/routes/provider.routes.ts
var import_express5 = require("express");

// src/controllers/provider.controller.ts
var getMyProviderProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    let profile = await prisma_default.providerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { fullName: true, phone: true, city: true, area: true, avatarUrl: true } },
        skills: { include: { service: { include: { subcategory: { include: { category: true } } } } } },
        portfolio: true,
        serviceAreas: { include: { area: { include: { city: true } } } }
      }
    });
    if (!profile) {
      profile = await prisma_default.providerProfile.create({
        data: { userId },
        include: {
          user: { select: { fullName: true, phone: true, city: true, area: true, avatarUrl: true } },
          skills: true,
          portfolio: true,
          serviceAreas: true
        }
      });
    }
    return res.json({ profile });
  } catch (error) {
    console.error("Fetch Provider Profile Error:", error);
    return res.status(500).json({ error: "Failed to fetch provider profile." });
  }
};
var updateProviderProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const {
      bio,
      experienceYears,
      hourlyRate,
      dailyRate,
      projectRate,
      startingPrice,
      isAvailable,
      languages,
      isPublished
      // 6.10 Publish/Unpublish
    } = req.body;
    const updatedProfile = await prisma_default.providerProfile.update({
      where: { userId },
      data: {
        ...bio !== void 0 && { bio },
        ...experienceYears !== void 0 && { experienceYears },
        ...hourlyRate !== void 0 && { hourlyRate },
        ...dailyRate !== void 0 && { dailyRate },
        ...projectRate !== void 0 && { projectRate },
        ...startingPrice !== void 0 && { startingPrice },
        ...isAvailable !== void 0 && { isAvailable },
        ...languages !== void 0 && { languages },
        ...isPublished !== void 0 && { isPublished }
        // Assuming schema supports or handled via availability/status
      },
      include: {
        skills: true,
        portfolio: true,
        serviceAreas: true
      }
    });
    return res.json({ message: "Profile updated successfully", profile: updatedProfile });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ error: "Failed to update provider profile." });
  }
};
var addProviderSkill = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { serviceId, rate } = req.body;
    if (!serviceId) return res.status(400).json({ error: "Service ID is required." });
    const profile = await prisma_default.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: "Provider profile not found." });
    const providerSkill = await prisma_default.providerSkill.upsert({
      where: {
        providerId_serviceId: {
          providerId: profile.id,
          serviceId
        }
      },
      update: { rate },
      create: {
        providerId: profile.id,
        serviceId,
        rate
      },
      include: { service: true }
    });
    return res.status(201).json({ message: "Skill added/updated successfully", providerSkill });
  } catch (error) {
    console.error("Add Skill Error:", error);
    return res.status(500).json({ error: "Failed to add skill." });
  }
};
var removeProviderSkill = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { skillId } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    await prisma_default.providerSkill.delete({ where: { id: skillId } });
    return res.json({ message: "Skill removed successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to remove skill." });
  }
};
var addServiceArea = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { areaId } = req.body;
    if (!userId || !areaId) return res.status(400).json({ error: "Area ID is required." });
    const profile = await prisma_default.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: "Provider profile not found." });
    const serviceArea = await prisma_default.providerServiceArea.create({
      data: {
        providerId: profile.id,
        areaId
      },
      include: { area: { include: { city: true } } }
    });
    return res.status(201).json({ message: "Service area added successfully", serviceArea });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add service area." });
  }
};
var removeServiceArea = async (req, res) => {
  try {
    const { areaMappingId } = req.params;
    await prisma_default.providerServiceArea.delete({ where: { id: areaMappingId } });
    return res.json({ message: "Service area removed successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to remove service area." });
  }
};
var addPortfolioItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { title, description, imageUrl } = req.body;
    if (!userId || !imageUrl || !title) {
      return res.status(400).json({ error: "Title and image URL are required." });
    }
    const profile = await prisma_default.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: "Provider profile not found." });
    const portfolioItem = await prisma_default.portfolioItem.create({
      data: {
        providerId: profile.id,
        title,
        description,
        imageUrl
      }
    });
    return res.status(201).json({ message: "Portfolio item added successfully", portfolioItem });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add portfolio item." });
  }
};
var removePortfolioItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await prisma_default.portfolioItem.delete({ where: { id: itemId } });
    return res.json({ message: "Portfolio item deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete portfolio item." });
  }
};
var getProviderDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const profile = await prisma_default.providerProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        portfolio: true,
        serviceAreas: true,
        reviewsReceived: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { customer: { select: { fullName: true, avatarUrl: true } } }
        }
      }
    });
    if (!profile) return res.status(404).json({ error: "Provider profile not found." });
    const activeRequestsCount = await prisma_default.serviceRequest.count({
      where: { providerId: profile.id, status: "PENDING" }
    });
    const totalRequestsCount = await prisma_default.serviceRequest.count({
      where: { providerId: profile.id }
    });
    return res.json({
      dashboard: {
        profile,
        metrics: {
          completedJobs: profile.completedJobs,
          ratingAvg: profile.ratingAvg,
          reviewCount: profile.reviewCount,
          activeRequestsCount,
          totalRequestsCount,
          isAvailable: profile.isAvailable
        }
      }
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({ error: "Failed to load provider dashboard." });
  }
};

// src/routes/provider.routes.ts
var router5 = (0, import_express5.Router)();
router5.use(authenticate, requireRole("PROVIDER"));
router5.get("/profile", getMyProviderProfile);
router5.patch("/profile", updateProviderProfile);
router5.get("/dashboard", getProviderDashboard);
router5.post("/skills", addProviderSkill);
router5.delete("/skills/:skillId", removeProviderSkill);
router5.post("/areas", addServiceArea);
router5.delete("/areas/:areaMappingId", removeServiceArea);
router5.post("/portfolio", addPortfolioItem);
router5.delete("/portfolio/:itemId", removePortfolioItem);
var provider_routes_default = router5;

// src/routes/review.routes.ts
var import_express6 = require("express");

// src/controllers/review.controller.ts
var createReview = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { providerId, rating, comment, quality, punctuality } = req.body;
    if (!providerId || !rating) {
      return res.status(400).json({ error: "Provider ID and rating are required." });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }
    const provider = await prisma_default.providerProfile.findUnique({
      where: { id: providerId }
    });
    if (!provider) {
      return res.status(404).json({ error: "Provider profile not found." });
    }
    const review = await prisma_default.review.create({
      data: {
        customerId,
        providerId,
        rating,
        comment,
        quality,
        punctuality
      }
    });
    const allReviews = await prisma_default.review.findMany({
      where: { providerId }
    });
    const reviewCount = allReviews.length;
    const ratingSum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const ratingAvg = Number((ratingSum / reviewCount).toFixed(1));
    await prisma_default.providerProfile.update({
      where: { id: providerId },
      data: {
        ratingAvg,
        reviewCount
      }
    });
    return res.status(201).json({
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    console.error("Create Review Error:", error);
    return res.status(500).json({ error: "Internal server error while submitting review." });
  }
};
var getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    const reviews = await prisma_default.review.findMany({
      where: { providerId },
      include: {
        customer: {
          select: {
            fullName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ reviews });
  } catch (error) {
    console.error("Fetch Reviews Error:", error);
    return res.status(500).json({ error: "Internal server error while fetching reviews." });
  }
};

// src/routes/review.routes.ts
var router6 = (0, import_express6.Router)();
router6.post("/", authenticate, createReview);
router6.get("/provider/:providerId", getProviderReviews);
var review_routes_default = router6;

// src/routes/safety.routes.ts
var import_express7 = require("express");

// src/controllers/safety.controller.ts
var reportUserOrProvider = async (req, res) => {
  try {
    const reporterId = req.user?.id;
    const { reportedId, reason, details } = req.body;
    if (!reportedId || !reason) {
      return res.status(400).json({ error: "Reported user ID and reason are required." });
    }
    if (reporterId === reportedId) {
      return res.status(400).json({ error: "You cannot report yourself." });
    }
    const report = await prisma_default.report.create({
      data: {
        reporterId,
        reportedId,
        reason,
        details
      }
    });
    return res.status(201).json({
      message: "Report submitted successfully. Our safety team will review it.",
      report
    });
  } catch (error) {
    console.error("Report Error:", error);
    return res.status(500).json({ error: "Internal server error while filing report." });
  }
};

// src/routes/safety.routes.ts
var router7 = (0, import_express7.Router)();
router7.post("/report", authenticate, reportUserOrProvider);
var safety_routes_default = router7;

// src/routes/trust.routes.ts
var import_express8 = require("express");

// src/controllers/report.controller.ts
var createReport = async (req, res) => {
  try {
    const reporterId = req.user?.id;
    const { reportedId, reason, details } = req.body;
    if (!reportedId || !reason) {
      return res.status(400).json({ error: "Reported user ID and reason are required." });
    }
    if (reporterId === reportedId) {
      return res.status(400).json({ error: "You cannot report yourself." });
    }
    const report = await prisma_default.report.create({
      data: {
        reporterId,
        reportedId,
        reason,
        details
      }
    });
    return res.status(201).json({ message: "Report submitted successfully. Our safety team will review it.", report });
  } catch (error) {
    console.error("Create Report Error:", error);
    return res.status(500).json({ error: "Failed to submit report." });
  }
};

// src/controllers/verification.controller.ts
var requestVerification = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { documentType, documentUrl } = req.body;
    if (!documentType || !documentUrl) {
      return res.status(400).json({ error: "Document type and URL are required." });
    }
    const providerProfile = await prisma_default.providerProfile.findUnique({
      where: { userId }
    });
    if (!providerProfile) {
      return res.status(404).json({ error: "Provider profile not found." });
    }
    const verificationRequest = await prisma_default.verificationRequest.create({
      data: {
        providerId: providerProfile.id,
        documentType,
        documentUrl
      }
    });
    return res.status(201).json({ message: "Verification request submitted successfully.", verificationRequest });
  } catch (error) {
    console.error("Verification Request Error:", error);
    return res.status(500).json({ error: "Failed to submit verification request." });
  }
};

// src/routes/trust.routes.ts
var router8 = (0, import_express8.Router)();
router8.post("/report", authenticate, createReport);
router8.post("/verify-request", authenticate, requireRole("PROVIDER"), requestVerification);
var trust_routes_default = router8;

// src/routes/admin.routes.ts
var import_express9 = require("express");

// src/controllers/admin.controller.ts
var getAdminDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalProviders, totalRequests, totalReviews, pendingReports] = await Promise.all([
      prisma_default.user.count(),
      prisma_default.providerProfile.count(),
      prisma_default.serviceRequest.count(),
      prisma_default.review.count(),
      prisma_default.report.count({ where: { isResolved: false } })
    ]);
    const recentReports = await prisma_default.report.findMany({
      where: { isResolved: false },
      include: {
        reporter: { select: { fullName: true, phone: true } },
        reported: { select: { fullName: true, phone: true } }
      },
      take: 10,
      orderBy: { createdAt: "desc" }
    });
    return res.json({
      stats: {
        totalUsers,
        totalProviders,
        totalRequests,
        totalReviews,
        pendingReports
      },
      recentReports
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return res.status(500).json({ error: "Internal server error fetching admin dashboard stats." });
  }
};
var resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await prisma_default.report.update({
      where: { id: reportId },
      data: { isResolved: true }
    });
    return res.json({ message: "Report marked as resolved.", report });
  } catch (error) {
    console.error("Resolve Report Error:", error);
    return res.status(500).json({ error: "Internal server error resolving report." });
  }
};
var verifyProviderAccount = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { isVerified } = req.body;
    const provider = await prisma_default.providerProfile.update({
      where: { id: providerId },
      data: { isVerified: Boolean(isVerified) }
    });
    return res.json({
      message: `Provider verification status updated successfully.`,
      provider
    });
  } catch (error) {
    console.error("Provider Verification Error:", error);
    return res.status(500).json({ error: "Internal server error updating verification status." });
  }
};

// src/routes/admin.routes.ts
var router9 = (0, import_express9.Router)();
router9.use(authenticate, requireRole("ADMIN"));
router9.get("/dashboard", getAdminDashboardStats);
router9.patch("/reports/:reportId/resolve", resolveReport);
router9.patch("/providers/:providerId/verify", verifyProviderAccount);
var admin_routes_default = router9;

// src/index.ts
import_dotenv.default.config();
var app = (0, import_express10.default)();
var server = import_http.default.createServer(app);
var io = new import_socket.Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.use((0, import_helmet.default)());
app.use((0, import_cors.default)());
app.use(import_express10.default.json());
app.use("/api/auth", auth_routes_default);
app.use("/api/providers", provider_routes_default);
app.use("/api/search", search_routes_default);
app.use("/api/requests", request_routes_default);
app.use("/api/messages", message_routes_default);
app.use("/api/providers", provider_routes_default);
app.use("/api/reviews", review_routes_default);
app.use("/api/safety", safety_routes_default);
app.use("/api/admin", admin_routes_default);
app.use("/api/trust", trust_routes_default);
app.use("/api/admin", admin_routes_default);
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "KAAM PAKISTAN API" });
});
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
  });
  socket.on("send_message", (data) => {
    io.to(data.conversationId).emit("receive_message", data);
  });
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});
var PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`KAAM PAKISTAN API running on port ${PORT}`);
});
