import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, X, Filter } from 'lucide-react-native';
import { FilterType, Service } from '@/types';

interface FilterDrawerProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  services: Service[];
  selectedServices: string[];
  onServiceToggle: (serviceId: string) => void;
  onClose: () => void;
}

export default function FilterDrawer({
  activeFilter,
  onFilterChange,
  selectedDate,
  onDateChange,
  services,
  selectedServices,
  onServiceToggle,
  onClose
}: FilterDrawerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDatePickerChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      onDateChange(date);
    }
  };

  const clearDateFilter = () => {
    onDateChange(null);
  };

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isAllServicesSelected = selectedServices.length === services.length;
  const isNoServicesSelected = selectedServices.length === 0;

  const toggleAllServices = () => {
    if (isAllServicesSelected || isNoServicesSelected) {
      // If all selected or none selected, clear all
      services.forEach(service => {
        if (selectedServices.includes(service.id)) {
          onServiceToggle(service.id);
        }
      });
    } else {
      // If some selected, select all
      services.forEach(service => {
        if (!selectedServices.includes(service.id)) {
          onServiceToggle(service.id);
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Filter size={20} color="#8B5CF6" />
          <Text style={styles.title}>Filters</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Filter Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Period</Text>
          <View style={styles.timeFilters}>
            <TouchableOpacity
              style={[styles.timeFilterButton, activeFilter === 'all' && styles.activeTimeFilter]}
              onPress={() => onFilterChange('all')}
            >
              <Text style={[styles.timeFilterText, activeFilter === 'all' && styles.activeTimeFilterText]}>
                All Time
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeFilterButton, activeFilter === 'upcoming' && styles.activeTimeFilter]}
              onPress={() => onFilterChange('upcoming')}
            >
              <Text style={[styles.timeFilterText, activeFilter === 'upcoming' && styles.activeTimeFilterText]}>
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeFilterButton, activeFilter === 'past' && styles.activeTimeFilter]}
              onPress={() => onFilterChange('past')}
            >
              <Text style={[styles.timeFilterText, activeFilter === 'past' && styles.activeTimeFilterText]}>
                Past
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Filter Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specific Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={18} color="#8B5CF6" />
            <Text style={styles.dateButtonText}>
              {selectedDate ? formatSelectedDate(selectedDate) : 'Select Date'}
            </Text>
          </TouchableOpacity>
          {selectedDate && (
            <TouchableOpacity style={styles.clearDateButton} onPress={clearDateFilter}>
              <Text style={styles.clearDateText}>Clear Date Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Services Filter Section */}
        <View style={styles.section}>
          <View style={styles.servicesHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            <TouchableOpacity onPress={toggleAllServices}>
              <Text style={styles.toggleAllText}>
                {isAllServicesSelected ? 'Clear All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {services.map(service => (
            <View key={service.id} style={styles.serviceItem}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDuration}>{service.duration} min</Text>
              </View>
              <Switch
                value={selectedServices.includes(service.id)}
                onValueChange={() => onServiceToggle(service.id)}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={selectedServices.includes(service.id) ? '#8B5CF6' : '#F3F4F6'}
              />
            </View>
          ))}

          {services.length === 0 && (
            <View style={styles.noServices}>
              <Text style={styles.noServicesText}>No services available</Text>
              <Text style={styles.noServicesSubtext}>Add services in Settings</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={onDatePickerChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8
  },
  closeButton: {
    padding: 4
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  section: {
    marginTop: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12
  },
  timeFilters: {
    gap: 8
  },
  timeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  activeTimeFilter: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6'
  },
  timeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center'
  },
  activeTimeFilterText: {
    color: 'white'
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  dateButtonText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  clearDateText: {
    fontSize: 12,
    color: '#EF4444',
    textDecorationLine: 'underline'
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  toggleAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500'
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  serviceInfo: {
    flex: 1
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2
  },
  serviceDuration: {
    fontSize: 12,
    color: '#6B7280'
  },
  noServices: {
    alignItems: 'center',
    paddingVertical: 20
  },
  noServicesText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4
  },
  noServicesSubtext: {
    fontSize: 12,
    color: '#9CA3AF'
  }
});