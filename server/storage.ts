import { 
  users, 
  type User, 
  type InsertUser,
  hospitals,
  type Hospital,
  type InsertHospital,
  bedTypes,
  type BedType,
  type InsertBedType,
  beds,
  type Bed,
  type InsertBed,
  bookings,
  type Booking,
  type InsertBooking
} from "@shared/schema";

// Interface for data storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Hospital operations
  getHospital(id: number): Promise<Hospital | undefined>;
  getHospitalByUsername(username: string): Promise<Hospital | undefined>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  updateHospitalApproval(id: number, approved: boolean): Promise<Hospital | undefined>;
  getAllHospitals(): Promise<Hospital[]>;
  getApprovedHospitals(): Promise<Hospital[]>;
  getPendingHospitals(): Promise<Hospital[]>;

  // Bed type operations
  getBedType(id: number): Promise<BedType | undefined>;
  getBedTypeByName(name: string): Promise<BedType | undefined>;
  createBedType(bedType: InsertBedType): Promise<BedType>;
  getAllBedTypes(): Promise<BedType[]>;

  // Bed operations
  getBed(id: number): Promise<Bed | undefined>;
  getBedsByHospital(hospitalId: number): Promise<Bed[]>;
  createBed(bed: InsertBed): Promise<Bed>;
  updateBed(id: number, bed: Partial<InsertBed>): Promise<Bed | undefined>;
  getBedByHospitalAndType(hospitalId: number, bedTypeId: number): Promise<Bed | undefined>;

  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  getBookingsByHospital(hospitalId: number): Promise<Booking[]>;
  getBookingsByUser(userId: number): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private hospitals: Map<number, Hospital>;
  private bedTypes: Map<number, BedType>;
  private beds: Map<number, Bed>;
  private bookings: Map<number, Booking>;

  private userCurrentId: number;
  private hospitalCurrentId: number;
  private bedTypeCurrentId: number;
  private bedCurrentId: number;
  private bookingCurrentId: number;

  constructor() {
    this.users = new Map();
    this.hospitals = new Map();
    this.bedTypes = new Map();
    this.beds = new Map();
    this.bookings = new Map();

    this.userCurrentId = 1;
    this.hospitalCurrentId = 1;
    this.bedTypeCurrentId = 1;
    this.bedCurrentId = 1;
    this.bookingCurrentId = 1;

    // Initialize with default bed types
    this.initDefaultBedTypes();
    // Initialize with admin user
    this.initAdminUser();
  }

  private initDefaultBedTypes() {
    const defaultBedTypes = ["ICU", "General", "Emergency", "Pediatric", "Maternity"];
    defaultBedTypes.forEach(name => {
      this.createBedType({ name });
    });
  }

  private initAdminUser() {
    this.createUser({
      username: "admin",
      password: "admin123", // In production, hash this
      email: "admin@medbeds.com",
      name: "System Administrator",
      role: "admin"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      // Ensure role field is set with a default value
      role: insertUser.role || 'user',
      // Ensure phone field is null if undefined
      phone: insertUser.phone || null
    };
    this.users.set(id, user);
    return user;
  }

  // Hospital methods
  async getHospital(id: number): Promise<Hospital | undefined> {
    return this.hospitals.get(id);
  }

  async getHospitalByUsername(username: string): Promise<Hospital | undefined> {
    return Array.from(this.hospitals.values()).find(
      (hospital) => hospital.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createHospital(insertHospital: InsertHospital): Promise<Hospital> {
    const id = this.hospitalCurrentId++;
    const hospital: Hospital = { 
      ...insertHospital, 
      id, 
      approved: false,
      website: insertHospital.website ?? null,
      latitude: insertHospital.latitude ?? null,
      longitude: insertHospital.longitude ?? null 
    };
    this.hospitals.set(id, hospital);
    return hospital;
  }

  async updateHospitalApproval(id: number, approved: boolean): Promise<Hospital | undefined> {
    const hospital = await this.getHospital(id);
    if (!hospital) return undefined;
    
    const updatedHospital: Hospital = { ...hospital, approved };
    this.hospitals.set(id, updatedHospital);
    return updatedHospital;
  }

  async getAllHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values());
  }

  async getApprovedHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values()).filter(hospital => hospital.approved);
  }

  async getPendingHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values()).filter(hospital => !hospital.approved);
  }

  // Bed type methods
  async getBedType(id: number): Promise<BedType | undefined> {
    return this.bedTypes.get(id);
  }

  async getBedTypeByName(name: string): Promise<BedType | undefined> {
    return Array.from(this.bedTypes.values()).find(
      (bedType) => bedType.name.toLowerCase() === name.toLowerCase()
    );
  }

  async createBedType(insertBedType: InsertBedType): Promise<BedType> {
    const id = this.bedTypeCurrentId++;
    const bedType: BedType = { 
      ...insertBedType, 
      id,
      description: insertBedType.description ?? null,
      icon: insertBedType.icon ?? null
    };
    this.bedTypes.set(id, bedType);
    return bedType;
  }

  async getAllBedTypes(): Promise<BedType[]> {
    return Array.from(this.bedTypes.values());
  }

  // Bed methods
  async getBed(id: number): Promise<Bed | undefined> {
    return this.beds.get(id);
  }

  async getBedsByHospital(hospitalId: number): Promise<Bed[]> {
    return Array.from(this.beds.values()).filter(
      (bed) => bed.hospitalId === hospitalId
    );
  }

  async createBed(insertBed: InsertBed): Promise<Bed> {
    const id = this.bedCurrentId++;
    const bed: Bed = { 
      ...insertBed, 
      id,
      pricePerNight: insertBed.pricePerNight ?? null
    };
    this.beds.set(id, bed);
    return bed;
  }

  async updateBed(id: number, bedData: Partial<InsertBed>): Promise<Bed | undefined> {
    const bed = await this.getBed(id);
    if (!bed) return undefined;
    
    const updatedBed: Bed = { ...bed, ...bedData };
    this.beds.set(id, updatedBed);
    return updatedBed;
  }

  async getBedByHospitalAndType(hospitalId: number, bedTypeId: number): Promise<Bed | undefined> {
    return Array.from(this.beds.values()).find(
      (bed) => bed.hospitalId === hospitalId && bed.bedTypeId === bedTypeId
    );
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingCurrentId++;
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      // Ensure status has a default value
      status: insertBooking.status || 'pending',
      // Ensure patientPhone and notes are null if undefined
      patientPhone: insertBooking.patientPhone || null,
      notes: insertBooking.notes || null
    };
    this.bookings.set(id, booking);

    // Update available beds count
    const bed = await this.getBedByHospitalAndType(booking.hospitalId, booking.bedTypeId);
    if (bed && bed.availableBeds > 0) {
      await this.updateBed(bed.id, { 
        availableBeds: bed.availableBeds - 1 
      });
    }

    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = await this.getBooking(id);
    if (!booking) return undefined;
    
    // If canceling a pending booking, restore the bed availability
    if (booking.status === 'pending' && status === 'canceled') {
      const bed = await this.getBedByHospitalAndType(booking.hospitalId, booking.bedTypeId);
      if (bed) {
        await this.updateBed(bed.id, { 
          availableBeds: bed.availableBeds + 1 
        });
      }
    }

    const updatedBooking: Booking = { ...booking, status };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async getBookingsByHospital(hospitalId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.hospitalId === hospitalId
    );
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.userId === userId
    );
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }
}

export const storage = new MemStorage();
