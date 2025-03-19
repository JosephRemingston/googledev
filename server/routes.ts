import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertHospitalSchema, 
  insertBedSchema, 
  insertBookingSchema,
  loginSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { hospitalApiService, updateApiConfig } from "./services/hospitalApi";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware setup
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: "medbeds-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Passport middleware setup
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup passport strategies
  setupPassportStrategies();

  // Error handler for API routes
  const apiErrorHandler = (err: any, req: Request, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ error: validationError.message });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  };

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: "Unauthorized" });
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && (req.user as any).role === "admin") {
      return next();
    }
    res.status(403).json({ error: "Forbidden" });
  };

  const isHospital = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.path.startsWith("/api/hospital")) {
      return next();
    }
    res.status(403).json({ error: "Forbidden" });
  };

  // Common auth routes
  app.post("/api/auth/user/login", (req, res, next) => {
    try {
      const data = loginSchema.parse(req.body);
      passport.authenticate("user-local", (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info.message });
        
        req.logIn(user, (err) => {
          if (err) return next(err);
          return res.json({ id: user.id, username: user.username, role: user.role });
        });
      })(req, res, next);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.post("/api/auth/hospital/login", (req, res, next) => {
    try {
      const data = loginSchema.parse(req.body);
      passport.authenticate("hospital-local", (err: any, hospital: any, info: any) => {
        if (err) return next(err);
        if (!hospital) return res.status(401).json({ error: info.message });
        if (!hospital.approved) return res.status(403).json({ error: "Hospital not approved yet" });
        
        req.logIn(hospital, (err) => {
          if (err) return next(err);
          return res.json({ 
            id: hospital.id, 
            username: hospital.username, 
            name: hospital.name,
            isHospital: true
          });
        });
      })(req, res, next);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.json(null);
    }
    
    const user = req.user as any;
    if (user.isHospital) {
      return res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        isHospital: true
      });
    } else {
      return res.json({
        id: user.id,
        username: user.username,
        role: user.role
      });
    }
  });

  // User registration
  app.post("/api/users/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }
      
      const newUser = await storage.createUser(data);
      res.status(201).json({ 
        id: newUser.id, 
        username: newUser.username,
        email: newUser.email,
        name: newUser.name
      });
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  // Hospital registration
  app.post("/api/hospitals/register", async (req, res) => {
    try {
      const data = insertHospitalSchema.parse(req.body);
      
      const existingHospital = await storage.getHospitalByUsername(data.username);
      if (existingHospital) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const newHospital = await storage.createHospital(data);
      res.status(201).json({ 
        id: newHospital.id, 
        name: newHospital.name,
        message: "Hospital registration submitted for approval"
      });
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  // Bed types routes
  app.get("/api/bedtypes", async (req, res) => {
    try {
      const bedTypes = await storage.getAllBedTypes();
      res.json(bedTypes);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  // Hospital routes
  app.get("/api/hospitals", async (req, res) => {
    try {
      const location = req.query.location as string | undefined;
      
      // Use hospital API service to get hospitals (potentially from external API)
      const hospitals = await hospitalApiService.getHospitalsByLocation(location);
      res.json(hospitals);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.get("/api/hospital/beds", isAuthenticated, isHospital, async (req, res) => {
    try {
      const hospital = req.user as any;
      const beds = await storage.getBedsByHospital(hospital.id);
      res.json(beds);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.post("/api/hospital/beds", isAuthenticated, isHospital, async (req, res) => {
    try {
      const hospital = req.user as any;
      const data = insertBedSchema.parse({
        ...req.body,
        hospitalId: hospital.id
      });
      
      // Check if bed type for this hospital already exists
      const existingBed = await storage.getBedByHospitalAndType(hospital.id, data.bedTypeId);
      if (existingBed) {
        // Update existing bed
        const updatedBed = await storage.updateBed(existingBed.id, data);
        return res.json(updatedBed);
      }
      
      // Create new bed
      const newBed = await storage.createBed(data);
      res.status(201).json(newBed);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.get("/api/hospital/bookings", isAuthenticated, isHospital, async (req, res) => {
    try {
      const hospital = req.user as any;
      const bookings = await storage.getBookingsByHospital(hospital.id);
      res.json(bookings);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.patch("/api/hospital/bookings/:id", isAuthenticated, isHospital, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["approved", "rejected", "canceled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Verify this booking belongs to this hospital
      const hospital = req.user as any;
      if (booking.hospitalId !== hospital.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      res.json(updatedBooking);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  // User booking routes
  app.get("/api/hospitals/:hospitalId/beds", async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      
      // First get the hospital to check if it's approved
      const hospital = await storage.getHospital(hospitalId);
      
      if (!hospital) {
        return res.status(404).json({ error: "Hospital not found" });
      }
      
      if (!hospital.approved) {
        return res.status(404).json({ error: "Hospital not found" });
      }
      
      // Fetch beds using the API service (which will try the external API first)
      const beds = await hospitalApiService.getHospitalBeds(hospitalId);
      const bedTypes = await storage.getAllBedTypes();
      
      // Enhance the beds data with bed type names
      const enhancedBeds = beds.map(bed => {
        const bedType = bedTypes.find(type => type.id === bed.bedTypeId);
        return {
          ...bed,
          bedTypeName: bedType ? bedType.name : "Unknown"
        };
      });
      
      res.json(enhancedBeds);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.post("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const data = insertBookingSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      // Verify hospital exists and is approved
      const hospital = await storage.getHospital(data.hospitalId);
      if (!hospital || !hospital.approved) {
        return res.status(404).json({ error: "Hospital not found" });
      }
      
      // Verify bed exists and has availability
      const bed = await storage.getBedByHospitalAndType(data.hospitalId, data.bedTypeId);
      if (!bed) {
        return res.status(404).json({ error: "Bed type not available at this hospital" });
      }
      
      if (bed.availableBeds <= 0) {
        return res.status(400).json({ error: "No beds available of this type" });
      }
      
      const newBooking = await storage.createBooking(data);
      res.status(201).json(newBooking);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.get("/api/user/bookings", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const bookings = await storage.getBookingsByUser(user.id);
      
      // Get hospitals and bed types to enhance booking data
      const hospitals = await storage.getAllHospitals();
      const bedTypes = await storage.getAllBedTypes();
      
      const enhancedBookings = bookings.map(booking => {
        const hospital = hospitals.find(h => h.id === booking.hospitalId);
        const bedType = bedTypes.find(t => t.id === booking.bedTypeId);
        
        return {
          ...booking,
          hospitalName: hospital ? hospital.name : "Unknown Hospital",
          bedTypeName: bedType ? bedType.name : "Unknown Bed Type"
        };
      });
      
      res.json(enhancedBookings);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.patch("/api/user/bookings/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const bookingId = parseInt(req.params.id);
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Verify this booking belongs to this user
      if (booking.userId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Only pending bookings can be canceled
      if (booking.status !== "pending") {
        return res.status(400).json({ error: "Can only cancel pending bookings" });
      }
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, "canceled");
      res.json(updatedBooking);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  // Admin routes
  app.get("/api/admin/hospitals/pending", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hospitals = await storage.getPendingHospitals();
      res.json(hospitals);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.patch("/api/admin/hospitals/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      const hospital = await storage.getHospital(hospitalId);
      
      if (!hospital) {
        return res.status(404).json({ error: "Hospital not found" });
      }
      
      const updatedHospital = await storage.updateHospitalApproval(hospitalId, true);
      res.json(updatedHospital);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  app.patch("/api/admin/hospitals/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      const hospital = await storage.getHospital(hospitalId);
      
      if (!hospital) {
        return res.status(404).json({ error: "Hospital not found" });
      }
      
      const updatedHospital = await storage.updateHospitalApproval(hospitalId, false);
      res.json(updatedHospital);
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });
  
  // API Configuration routes
  app.post("/api/config/api-key", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { apiKey, apiUrl } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }
      
      // Update the API configuration
      updateApiConfig({
        apiKey,
        ...(apiUrl && { apiUrl })
      });
      
      // Check if the API is now available with new config
      const isAvailable = await hospitalApiService.isApiAvailable();
      
      res.json({ 
        success: true, 
        apiConfig: hospitalApiService.getApiConfig(),
        apiAvailable: isAvailable
      });
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });
  
  // API Status route
  app.get("/api/config/api-status", async (req, res) => {
    try {
      const available = await hospitalApiService.isApiAvailable();
      const config = hospitalApiService.getApiConfig();
      
      res.json({
        available,
        hasApiKey: config.hasApiKey,
        apiUrl: config.apiUrl
      });
    } catch (err) {
      apiErrorHandler(err, req, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function setupPassportStrategies() {
  // User authentication strategy
  passport.use(
    "user-local",
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // In a real app, compare hashed passwords
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Hospital authentication strategy
  passport.use(
    "hospital-local",
    new LocalStrategy(async (username, password, done) => {
      try {
        const hospital = await storage.getHospitalByUsername(username);
        if (!hospital) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // In a real app, compare hashed passwords
        if (hospital.password !== password) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // Add a flag to identify as hospital
        const hospitalWithFlag = {
          ...hospital,
          isHospital: true
        };
        
        return done(null, hospitalWithFlag);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialize user/hospital for session storage
  passport.serializeUser((user: any, done) => {
    done(null, { id: user.id, isHospital: !!user.isHospital });
  });

  // Deserialize user/hospital from session
  passport.deserializeUser(async (data: any, done) => {
    try {
      if (data.isHospital) {
        const hospital = await storage.getHospital(data.id);
        if (!hospital) {
          return done(null, false);
        }
        return done(null, { ...hospital, isHospital: true });
      } else {
        const user = await storage.getUser(data.id);
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  });
}
