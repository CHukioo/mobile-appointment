import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, Service, AppSettings } from '@/types';

const APPOINTMENTS_KEY = 'appointments';
const SERVICES_KEY = 'services';
const SETTINGS_KEY = 'settings';

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  sms: {
    template: 'Dear [Client Name], this is a reminder for your [Service] appointment at [Time]. See you soon!',
    reminderMinutes: 60
  }
};

// Default services
const DEFAULT_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Haircut',
    duration: 60,
    createdAt: new Date()
  },
  {
    id: '2',
    name: 'Hair Color',
    duration: 120,
    createdAt: new Date()
  },
  {
    id: '3',
    name: 'Massage Therapy',
    duration: 90,
    createdAt: new Date()
  }
];

export const storageUtils = {
  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    try {
      const data = await AsyncStorage.getItem(APPOINTMENTS_KEY);
      if (data) {
        const appointments = JSON.parse(data);
        return appointments.map((apt: any) => ({
          ...apt,
          startDate: new Date(apt.startDate),
          endDate: new Date(apt.endDate),
          createdAt: new Date(apt.createdAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading appointments:', error);
      return [];
    }
  },

  async saveAppointment(appointment: Appointment): Promise<void> {
    try {
      const appointments = await this.getAppointments();
      appointments.push(appointment);
      await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  },

  async deleteAppointment(id: string): Promise<void> {
    try {
      const appointments = await this.getAppointments();
      const filtered = appointments.filter(apt => apt.id !== id);
      await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  },

  // Services
  async getServices(): Promise<Service[]> {
    try {
      const data = await AsyncStorage.getItem(SERVICES_KEY);
      if (data) {
        const services = JSON.parse(data);
        return services.map((service: any) => ({
          ...service,
          createdAt: new Date(service.createdAt)
        }));
      }
      // Initialize with default services
      await this.saveServices(DEFAULT_SERVICES);
      return DEFAULT_SERVICES;
    } catch (error) {
      console.error('Error loading services:', error);
      return DEFAULT_SERVICES;
    }
  },

  async saveServices(services: Service[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(services));
    } catch (error) {
      console.error('Error saving services:', error);
    }
  },

  async addService(service: Service): Promise<void> {
    try {
      const services = await this.getServices();
      services.push(service);
      await this.saveServices(services);
    } catch (error) {
      console.error('Error adding service:', error);
    }
  },

  async deleteService(id: string): Promise<void> {
    try {
      const services = await this.getServices();
      const filtered = services.filter(service => service.id !== id);
      await this.saveServices(filtered);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      await this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
};