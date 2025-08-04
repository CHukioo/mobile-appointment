import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, CreditCard as Edit, MessageSquare, Smartphone, Clock, Save } from 'lucide-react-native';
import { Service, AppSettings } from '@/types';
import { storageUtils } from '@/utils/storage';
import { testSMS } from '@/utils/sms';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [showEditService, setShowEditService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('60');
  const [smsTemplate, setSmsTemplate] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState('60');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

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
      setSmsTemplate(settingsData.sms.template);
      setReminderMinutes(settingsData.sms.reminderMinutes.toString());
    } catch (error) {
      Alert.alert('Error', 'Failed to load settings');
    }
  };

  const handleAddService = async () => {
    if (!newServiceName.trim()) {
      Alert.alert('Error', 'Please enter service name');
      return;
    }

    const duration = parseInt(newServiceDuration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'Please enter valid duration');
      return;
    }

    try {
      const newService: Service = {
        id: Date.now().toString(),
        name: newServiceName.trim(),
        duration,
        createdAt: new Date()
      };

      await storageUtils.addService(newService);
      setNewServiceName('');
      setNewServiceDuration('60');
      setShowAddService(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add service');
    }
  };

  const handleEditService = async () => {
    if (!editingService || !newServiceName.trim()) {
      Alert.alert('Error', 'Please enter service name');
      return;
    }

    const duration = parseInt(newServiceDuration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'Please enter valid duration');
      return;
    }

    try {
      const updatedServices = services.map(service => 
        service.id === editingService.id
          ? { ...service, name: newServiceName.trim(), duration }
          : service
      );

      await storageUtils.saveServices(updatedServices);
      setEditingService(null);
      setNewServiceName('');
      setNewServiceDuration('60');
      setShowEditService(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update service');
    }
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageUtils.deleteService(service.id);
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete service');
            }
          }
        }
      ]
    );
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setNewServiceName(service.name);
    setNewServiceDuration(service.duration.toString());
    setShowEditService(true);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    const minutes = parseInt(reminderMinutes);
    if (isNaN(minutes) || minutes < 0) {
      Alert.alert('Error', 'Please enter valid reminder time');
      return;
    }

    try {
      const updatedSettings: AppSettings = {
        ...settings,
        sms: {
          template: smsTemplate,
          reminderMinutes: minutes
        }
      };

      await storageUtils.saveSettings(updatedSettings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleTestSMS = async () => {
    if (!testPhoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number to test');
      return;
    }

    try {
      const success = await testSMS(testPhoneNumber.trim());
      if (success) {
        Alert.alert('Success', 'Test SMS sent successfully!');
      } else {
        Alert.alert('Error', 'Failed to send test SMS. Check your API configuration.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send test SMS');
    }
  };

  const apiKey = Constants.expoConfig?.extra?.HTTPSMS_API_KEY || process.env.EXPO_PUBLIC_HTTPSMS_API_KEY;
  const devicePhone = Constants.expoConfig?.extra?.DEVICE_PHONE_NUMBER || process.env.EXPO_PUBLIC_DEVICE_PHONE_NUMBER;
  const isConfigured = apiKey && apiKey !== 'YOUR_API_KEY_HERE' && devicePhone && devicePhone !== '+1234567890';

  const renderServiceModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditService : showAddService}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        if (isEdit) {
          setShowEditService(false);
          setEditingService(null);
        } else {
          setShowAddService(false);
        }
        setNewServiceName('');
        setNewServiceDuration('60');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {isEdit ? 'Edit Service' : 'Add New Service'}
          </Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Service name"
            value={newServiceName}
            onChangeText={setNewServiceName}
            placeholderTextColor="#9CA3AF"
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="Duration (minutes)"
            value={newServiceDuration}
            onChangeText={setNewServiceDuration}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                if (isEdit) {
                  setShowEditService(false);
                  setEditingService(null);
                } else {
                  setShowAddService(false);
                }
                setNewServiceName('');
                setNewServiceDuration('60');
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={isEdit ? handleEditService : handleAddService}
            >
              <Text style={styles.modalSaveText}>
                {isEdit ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your services and preferences</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddService(true)}
            >
              <Plus size={16} color="white" />
            </TouchableOpacity>
          </View>

          {services.map(service => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDuration}>{service.duration} minutes</Text>
              </View>
              <View style={styles.serviceActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditService(service)}
                >
                  <Edit size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteService(service)}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {services.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No services added yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first service</Text>
            </View>
          )}
        </View>

        {/* SMS Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SMS Reminders</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Smartphone size={20} color="#EF4444" />
              <Text style={styles.settingLabel}>API Configuration</Text>
            </View>
            <Text style={styles.configStatus}>
              Status: {isConfigured ? '✅ Configured' : '❌ Not Configured'}
            </Text>
            <Text style={styles.configInfo}>
              Device Phone: {devicePhone || 'Not set'}
            </Text>
            <Text style={styles.configInfo}>
              API Key: {apiKey && apiKey !== 'YOUR_API_KEY_HERE' ? '✅ Set' : '❌ Not set'}
            </Text>
            <Text style={styles.configHint}>
              Edit the .env file or app.json to configure your HTTPSMS API key and device phone number.
            </Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Clock size={20} color="#8B5CF6" />
              <Text style={styles.settingLabel}>Reminder Time</Text>
            </View>
            <View style={styles.reminderTimeContainer}>
              <TextInput
                style={styles.reminderInput}
                value={reminderMinutes}
                onChangeText={setReminderMinutes}
                keyboardType="numeric"
                placeholder="60"
              />
              <Text style={styles.reminderUnit}>minutes before</Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <MessageSquare size={20} color="#F59E0B" />
              <Text style={styles.settingLabel}>Message Template</Text>
            </View>
            <TextInput
              style={styles.templateInput}
              value={smsTemplate}
              onChangeText={setSmsTemplate}
              multiline
              numberOfLines={4}
              placeholder="Enter your SMS template..."
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.templateHint}>
              Use [Client Name], [Service], [Time], and [Date] as placeholders. SMS will be sent automatically via HTTPSMS API.
            </Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <MessageSquare size={20} color="#10B981" />
              <Text style={styles.settingLabel}>Test SMS</Text>
            </View>
            <TextInput
              style={styles.settingInput}
              value={testPhoneNumber}
              onChangeText={setTestPhoneNumber}
              placeholder="Enter phone number to test (e.g., +1234567890)"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
            <TouchableOpacity 
              style={[styles.testButton, !isConfigured && styles.testButtonDisabled]} 
              onPress={handleTestSMS}
              disabled={!isConfigured}
            >
              <Text style={styles.testButtonText}>Send Test SMS</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveSettingsButton} onPress={handleSaveSettings}>
            <Save size={18} color="white" />
            <Text style={styles.saveSettingsText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderServiceModal(false)}
      {renderServiceModal(true)}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937'
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  serviceInfo: {
    flex: 1
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4
  },
  serviceDuration: {
    fontSize: 14,
    color: '#6B7280'
  },
  serviceActions: {
    flexDirection: 'row'
  },
  editButton: {
    padding: 8,
    marginRight: 4
  },
  deleteButton: {
    padding: 8
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF'
  },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12
  },
  settingInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  reminderTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reminderInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: 80,
    textAlign: 'center'
  },
  reminderUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12
  },
  templateInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 80,
    textAlignVertical: 'top'
  },
  templateHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic'
  },
  configStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  configInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  configHint: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8
  },
  testButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12
  },
  testButtonDisabled: {
    backgroundColor: '#9CA3AF'
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white'
  },
  saveSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 32
  },
  saveSettingsText: {
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
    padding: 24
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalCancelButton: {
    flex: 0.45,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280'
  },
  modalSaveButton: {
    flex: 0.45,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#8B5CF6'
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  }
});