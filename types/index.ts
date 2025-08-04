export interface Appointment {
  id: string;
  startDate: Date;
  endDate: Date;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  createdAt: Date;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  createdAt: Date;
}

export interface SMSSettings {
  template: string;
  reminderMinutes: number;
}

export interface AppSettings {
  sms: SMSSettings;
}

export type FilterType = 'all' | 'upcoming' | 'past';