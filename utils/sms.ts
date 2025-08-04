import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Appointment, SMSSettings } from '@/types';

const HTTPSMS_API_URL = 'https://api.httpsms.com/v1/messages/send';

export const formatSMSMessage = (
  template: string,
  appointment: Appointment
): string => {
  const timeString = appointment.startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const dateString = appointment.startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return template
    .replace(/\[Client Name\]/g, appointment.clientName)
    .replace(/\[Service\]/g, appointment.serviceName)
    .replace(/\[Time\]/g, timeString)
    .replace(/\[Date\]/g, dateString);
};

export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    const apiKey = Constants.expoConfig?.extra?.HTTPSMS_API_KEY || 
                   process.env.EXPO_PUBLIC_HTTPSMS_API_KEY;
    const devicePhoneNumber = Constants.expoConfig?.extra?.DEVICE_PHONE_NUMBER || 
                              process.env.EXPO_PUBLIC_DEVICE_PHONE_NUMBER;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.log('SMS API key not configured');
      if (Platform.OS === 'web') {
        alert(`SMS Preview (API Key Required)\n\nTo: ${phoneNumber}\nFrom: ${devicePhoneNumber}\nMessage: ${message}`);
        return true;
      }
      return false;
    }

    if (!devicePhoneNumber || devicePhoneNumber === '+1234567890') {
      console.log('Device phone number not configured');
      if (Platform.OS === 'web') {
        alert(`SMS Preview (Phone Number Required)\n\nTo: ${phoneNumber}\nMessage: ${message}`);
        return true;
      }
      return false;
    }

    // Generate a unique request ID
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const requestBody = {
      content: message,
      encrypted: false,
      from: devicePhoneNumber,
      request_id: requestId,
      to: phoneNumber
    };

    console.log('Sending SMS via HTTPSMS API:', {
      to: phoneNumber,
      from: devicePhoneNumber,
      message: message.substring(0, 50) + '...'
    });

    const response = await fetch(HTTPSMS_API_URL, {
      method: 'POST',
      headers: {
        'x-api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('SMS sent successfully:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.error('SMS sending failed:', response.status, errorText);
      
      // Show error details in development
      if (__DEV__) {
        alert(`SMS Error: ${response.status}\n${errorText}`);
      }
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Show error in development
    if (__DEV__) {
      alert(`SMS Error: ${error}`);
    }
    return false;
  }
};

export const scheduleReminder = (
  appointment: Appointment,
  settings: SMSSettings
): void => {
  const reminderTime = new Date(appointment.startDate);
  reminderTime.setMinutes(reminderTime.getMinutes() - settings.reminderMinutes);

  const now = new Date();
  const delay = reminderTime.getTime() - now.getTime();

  if (delay > 0) {
    console.log(`Scheduling SMS reminder in ${Math.round(delay / 1000 / 60)} minutes for ${appointment.clientName}`);
    
    setTimeout(async () => {
      console.log(`Sending SMS reminder to ${appointment.clientName} at ${appointment.clientPhone}`);
      const message = formatSMSMessage(settings.template, appointment);
      const success = await sendSMS(appointment.clientPhone, message);
      
      if (success) {
        console.log(`✅ SMS reminder sent successfully to ${appointment.clientName}`);
      } else {
        console.log(`❌ Failed to send SMS reminder to ${appointment.clientName}`);
      }
    }, delay);
  } else {
    console.log(`⏰ Reminder time has already passed for ${appointment.clientName}`);
  }
};

// Test SMS function for development
export const testSMS = async (phoneNumber: string): Promise<boolean> => {
  const testMessage = "Test message from your appointment scheduler app. If you receive this, SMS is working correctly!";
  return await sendSMS(phoneNumber, testMessage);
};