import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Trash2, Phone, Clock } from 'lucide-react-native';
import { Appointment } from '@/types';
import { formatTime, isPast } from '@/utils/dateUtils';

interface AppointmentCardProps {
  appointment: Appointment;
  onDelete: (id: string) => void;
}

export default function AppointmentCard({ appointment, onDelete }: AppointmentCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete the appointment with ${appointment.clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(appointment.id)
        }
      ]
    );
  };

  const isAppointmentPast = isPast(appointment.endDate);

  return (
    <View style={[styles.card, isAppointmentPast && styles.pastCard]}>
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.time}>
            {formatTime(appointment.startDate)} - {formatTime(appointment.endDate)}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.clientName}>{appointment.clientName}</Text>
      <Text style={styles.service}>{appointment.serviceName}</Text>
      
      <View style={styles.footer}>
        <View style={styles.phoneContainer}>
          <Phone size={14} color="#6B7280" />
          <Text style={styles.phone}>{appointment.clientPhone}</Text>
        </View>
        {isAppointmentPast && (
          <Text style={styles.pastLabel}>Completed</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6'
  },
  pastCard: {
    opacity: 0.7,
    borderLeftColor: '#9CA3AF'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 6
  },
  deleteButton: {
    padding: 4
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4
  },
  service: {
    fontSize: 16,
    color: '#14B8A6',
    fontWeight: '600',
    marginBottom: 12
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  phone: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6
  },
  pastLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  }
});