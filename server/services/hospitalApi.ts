import axios from 'axios';
import { Hospital, InsertHospital, Bed, BedType } from '@shared/schema';
import { storage } from '../storage';

// API configuration that can be updated at runtime
interface ApiConfig {
  apiKey: string;
  apiUrl: string;
}

// Default configuration from environment variables
let apiConfig: ApiConfig = {
  apiKey: process.env.HOSPITAL_API_KEY || '',
  apiUrl: process.env.HOSPITAL_API_URL || 'https://api.healthcare.gov/api/v1'
};

// Function to update API configuration
export function updateApiConfig(config: Partial<ApiConfig>): void {
  apiConfig = {
    ...apiConfig,
    ...config
  };
  console.log('API configuration updated');
}

// Interface for API responses
interface ApiHospital {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  email: string;
  website: string;
  beds: {
    type: string;
    total: number;
    available: number;
  }[];
  location: {
    lat: number;
    lng: number;
  };
}

// Transform API hospital data to our schema
function transformHospitalData(apiHospital: ApiHospital): InsertHospital {
  return {
    username: `hospital_${apiHospital.id}`,
    password: 'temporary_password', // This would be changed on first login
    name: apiHospital.name,
    address: apiHospital.address.street,
    city: apiHospital.address.city,
    state: apiHospital.address.state,
    zipCode: apiHospital.address.zipCode,
    phone: apiHospital.phone,
    email: apiHospital.email,
    website: apiHospital.website || '',
    latitude: apiHospital.location.lat.toString(),
    longitude: apiHospital.location.lng.toString(),
  };
}

// Service class for hospital API operations
export class HospitalApiService {
  private readonly apiClient;

  constructor() {
    // Initialize API client with optional authentication
    this.apiClient = axios.create({
      baseURL: apiConfig.apiUrl,
      headers: apiConfig.apiKey ? { 'X-API-KEY': apiConfig.apiKey } : {},
    });
  }

  // Get current API configuration (without exposing the actual key)
  getApiConfig(): { apiUrl: string, hasApiKey: boolean } {
    return {
      apiUrl: apiConfig.apiUrl,
      hasApiKey: !!apiConfig.apiKey
    };
  }

  // Check if the API is available
  async isApiAvailable(): Promise<boolean> {
    try {
      // If API key is not set, use fallback data
      if (!apiConfig.apiKey) {
        return false;
      }
      
      // Update client with latest config
      this.apiClient.defaults.baseURL = apiConfig.apiUrl;
      this.apiClient.defaults.headers['X-API-KEY'] = apiConfig.apiKey;
      
      // Try to fetch health status from API
      const response = await this.apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Hospital API not available:', error);
      return false;
    }
  }

  // Fetch hospitals by location (city, state, or zip)
  async getHospitalsByLocation(location?: string): Promise<Hospital[]> {
    try {
      // If API is not available, use local storage
      if (!await this.isApiAvailable()) {
        const hospitals = await storage.getApprovedHospitals();
        return hospitals;
      }

      // Fetch from API with optional location filter
      const params = location ? { location } : {};
      const response = await this.apiClient.get<ApiHospital[]>('/hospitals', { params });
      
      // Process and store each hospital
      const hospitals: Hospital[] = [];
      
      for (const apiHospital of response.data) {
        // Check if hospital already exists
        let hospital = await storage.getHospitalByUsername(`hospital_${apiHospital.id}`);
        
        if (!hospital) {
          // Transform and create new hospital
          const hospitalData = transformHospitalData(apiHospital);
          hospital = await storage.createHospital(hospitalData);
          
          // Approve hospital automatically
          hospital = await storage.updateHospitalApproval(hospital.id, true) || hospital;
          
          // Process bed data
          await this.processHospitalBeds(hospital.id, apiHospital.beds);
        }
        
        hospitals.push(hospital);
      }
      
      return hospitals;
    } catch (error) {
      console.error('Error fetching hospitals from API:', error);
      // Fallback to local storage if API fails
      return storage.getApprovedHospitals();
    }
  }
  
  // Process and store bed data for a hospital
  private async processHospitalBeds(hospitalId: number, apiBeds: ApiHospital['beds']): Promise<void> {
    try {
      // Get all bed types
      const bedTypes = await storage.getAllBedTypes();
      const bedTypeMap: Record<string, number> = {};
      
      // Create a mapping of bed type names to IDs
      for (const bedType of bedTypes) {
        bedTypeMap[bedType.name.toLowerCase()] = bedType.id;
      }
      
      // Process each bed type
      for (const apiBed of apiBeds) {
        // Find or create the bed type
        let bedTypeId = bedTypeMap[apiBed.type.toLowerCase()];
        
        if (!bedTypeId) {
          // Create a new bed type if it doesn't exist
          const newBedType = await storage.createBedType({
            name: apiBed.type
          });
          
          bedTypeId = newBedType.id;
          bedTypeMap[apiBed.type.toLowerCase()] = bedTypeId;
        }
        
        // Find existing bed or create new one
        const existingBed = await storage.getBedByHospitalAndType(hospitalId, bedTypeId);
        
        if (existingBed) {
          // Update existing bed
          await storage.updateBed(existingBed.id, {
            totalBeds: apiBed.total,
            availableBeds: apiBed.available
          });
        } else {
          // Create new bed with default price
          await storage.createBed({
            hospitalId,
            bedTypeId,
            totalBeds: apiBed.total,
            availableBeds: apiBed.available
          });
        }
      }
    } catch (error) {
      console.error(`Error processing beds for hospital ${hospitalId}:`, error);
    }
  }
  
  // Get detailed hospital information by ID
  async getHospitalById(id: number): Promise<Hospital | undefined> {
    try {
      // First check if we already have this hospital
      const localHospital = await storage.getHospital(id);
      if (!localHospital) {
        return undefined;
      }
      
      // If API is not available, return local data
      if (!await this.isApiAvailable()) {
        return localHospital;
      }
      
      // Get latest data from API if possible
      const response = await this.apiClient.get<ApiHospital>(`/hospitals/${localHospital.username.replace('hospital_', '')}`);
      
      if (response.data) {
        // Update hospital data
        await this.processHospitalBeds(id, response.data.beds);
        
        // Return the updated hospital
        return await storage.getHospital(id);
      }
      
      return localHospital;
    } catch (error) {
      console.error(`Error fetching hospital ${id} from API:`, error);
      // Fallback to local storage if API fails
      return storage.getHospital(id);
    }
  }
  
  // Get beds for a specific hospital
  async getHospitalBeds(hospitalId: number): Promise<Bed[]> {
    try {
      // First check if API is available
      if (!await this.isApiAvailable()) {
        return storage.getBedsByHospital(hospitalId);
      }
      
      // Get the hospital to extract its API ID
      const hospital = await storage.getHospital(hospitalId);
      if (!hospital) {
        return [];
      }
      
      const apiHospitalId = hospital.username.replace('hospital_', '');
      
      // Fetch latest bed data from API
      const response = await this.apiClient.get<ApiHospital>(`/hospitals/${apiHospitalId}`);
      
      if (response.data) {
        // Update bed information
        await this.processHospitalBeds(hospitalId, response.data.beds);
      }
      
      // Return updated bed data
      return storage.getBedsByHospital(hospitalId);
    } catch (error) {
      console.error(`Error fetching beds for hospital ${hospitalId} from API:`, error);
      // Fallback to local storage if API fails
      return storage.getBedsByHospital(hospitalId);
    }
  }
}

// Create and export a singleton instance
export const hospitalApiService = new HospitalApiService();