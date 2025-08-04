import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, User, Phone, Briefcase, Check } from 'lucide-react-native';
import { Appointment, Service, AppSettings } from '@/types';
import { storageUtils } from '@/utils/storage';
import { scheduleReminder } from '@/utils/sms';

export default function AddTerminScreen() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesData, settingsData] = await Promise.all([
        storageUtils.getServices(),
        storageUtils.getSettings()
      ]);
      setServices(servicesData);
      setSettings(settingsData);
      if (servicesData.length > 0 && !selectedServiceId) {
        setSelectedServiceId(servicesData[0].id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const validateForm = (): boolean => {
    if (!clientName.trim()) {
      Alert.alert('Validation Error', 'Please enter client name');
      return false;
    }
    if (!clientPhone.trim()) {
      Alert.alert('Validation Error', 'Please enter client phone number');
      return false;
    }
    if (!selectedServiceId) {
      Alert.alert('Validation Error', 'Please select a service');
      return false;
    }
    if (endDate <= startDate) {
      Alert.alert('Validation Error', 'End time must be after start time');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const selectedService = services.find(s => s.id === selectedServiceId);
      if (!selectedService) {
        Alert.alert('Error', 'Selected service not found');
        return;
      }

      const appointment: Appointment = {
        id: Date.now().toString(),
        startDate,
        endDate,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceId: selectedServiceId,
        serviceName: selectedService.name,
        createdAt: new Date()
      };

      await storageUtils.saveAppointment(appointment);

      // Schedule SMS reminder if settings are available
      if (settings) {
        scheduleReminder(appointment, settings.sms);
      }

      Alert.alert(
        'Success',
        'Appointment saved successfully!',
        [{ text: 'OK', onPress: resetForm }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 60 * 60 * 1000));
    setClientName('');
    setClientPhone('');
    setSelectedServiceId(services.length > 0 ? services[0].id : '');
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      // Auto-adjust end date to maintain duration
      const duration = endDate.getTime() - startDate.getTime();
      setEndDate(new Date(selectedDate.getTime() + duration));
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newStartDate = new Date(startDate);
      newStartDate.setHours(selectedTime.getHours());
      newStartDate.setMinutes(selectedTime.getMinutes());
      setStartDate(newStartDate);
      
      // Auto-adjust end date to maintain duration
      const duration = endDate.getTime() - startDate.getTime();
      setEndDate(new Date(newStartDate.getTime() + duration));
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const newEndDate = new Date(endDate);
      newEndDate.setHours(selectedTime.getHours());
      newEndDate.setMinutes(selectedTime.getMinutes());
      setEndDate(newEndDate);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Appointment</Text>
        <Text style={styles.subtitle}>Schedule a new client appointment</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          
          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Client full name"
              value={clientName}
              onChangeText={setClientName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Service Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service</Text>
          
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => setShowServicePicker(true)}
          >
            <Briefcase size={20} color="#6B7280" style={styles.inputIcon} />
            <Text style={styles.pickerText}>
              {selectedService ? selectedService.name : 'Select a service'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Calendar size={18} color="#8B5CF6" />
              <Text style={styles.dateTimeLabel}>Start Date</Text>
              <Text style={styles.dateTimeValue}>
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Clock size={18} color="#8B5CF6" />
              <Text style={styles.dateTimeLabel}>Start Time</Text>
              <Text style={styles.dateTimeValue}>
                {startDate.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Calendar size={18} color="#14B8A6" />
              <Text style={styles.dateTimeLabel}>End Date</Text>
              <Text style={styles.dateTimeValue}>
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Clock size={18} color="#14B8A6" />
              <Text style={styles.dateTimeLabel}>End Time</Text>
              <Text style={styles.dateTimeValue}>
                {endDate.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Check size={20} color="white" />
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Appointment'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Service Picker Modal */}
      <Modal
        visible={showServicePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServicePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Service</Text>
            <ScrollView style={styles.serviceList}>
              {services.map(service => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceOption,
                    selectedServiceId === service.id && styles.serviceOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedServiceId(service.id);
                    setShowServicePicker(false);
                  }}
                >
                  <Text style={[
                    styles.serviceOptionText,
                    selectedServiceId === service.id && styles.serviceOptionTextSelected
                  ]}>
                    {service.name}
                  </Text>
                  <Text style={styles.serviceDuration}>
                    {service.duration} min
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowServicePicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date/Time Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}
      {showStartTimePicker && (
        <DateTimePicker
          value={startDate}
          mode="time"
          display="default"
          onChange={onStartTimeChange}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          value={endDate}
          mode="time"
          display="default"
          onChange={onEndTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  section: {
    marginTop: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937'
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  dateTimeButton: {
    flex: 0.48,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    alignItems: 'center'
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937'
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 32
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF'
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingTop: 20,
    maxHeight: '70%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20
  },
  serviceList: {
    maxHeight: 300
  },
  serviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  serviceOptionSelected: {
    backgroundColor: '#F0F9FF'
  },
  serviceOptionText: {
    fontSize: 16,
    color: '#1F2937'
  },
  serviceOptionTextSelected: {
    color: '#0369A1',
    fontWeight: '600'
  },
  serviceDuration: {
    fontSize: 14,
    color: '#6B7280'
  },
  modalCloseButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280'
  }
});