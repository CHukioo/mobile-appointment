import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Filter, Calendar, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { storageUtils } from '@/utils/storage';
import { isToday, isPast, isFuture } from '@/utils/dateUtils';
import AppointmentCard from '@/components/AppointmentCard';

export default function HomeScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = async () => {
    try {
      const [appointmentsData, servicesData] = await Promise.all([
        storageUtils.getAppointments(),
        storageUtils.getServices()
      ]);
      
      // Sort appointments by start time
      const sortedAppointments = appointmentsData.sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
      
      setAppointments(sortedAppointments);
      setServices(servicesData);
      
      // Initialize with all services selected
      if (selectedServices.length === 0) {
        setSelectedServices(servicesData.map(s => s.id));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await storageUtils.deleteAppointment(id);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete appointment');
    }
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const filteredAppointments = appointments.filter(appointment => {
    // Filter by time
    let timeMatch = true;
    if (activeFilter === 'upcoming') {
      timeMatch = isFuture(appointment.startDate);
    } else if (activeFilter === 'past') {
      timeMatch = isPast(appointment.endDate);
    }

    // Filter by specific date
    let dateMatch = true;
    if (selectedDate) {
      dateMatch = isSameDay(appointment.startDate, selectedDate);
    }

    // Filter by services (only show if service is selected)
    const serviceMatch = selectedServices.length === 0 || selectedServices.includes(appointment.serviceId);

    return timeMatch && dateMatch && serviceMatch;
  });

  const todayAppointments = appointments.filter(apt => isToday(apt.startDate));

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <AppointmentCard
      appointment={item}
      onDelete={handleDeleteAppointment}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No appointments found</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'upcoming' 
          ? 'No upcoming appointments scheduled'
          : activeFilter === 'past'
          ? 'No past appointments found'
          : 'Start by adding your first appointment'
        }
      </Text>
    </View>
  );

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFilterSummary = () => {
    let summary = '';
    
    if (selectedDate) {
      summary += formatSelectedDate(selectedDate);
    } else {
      summary += activeFilter === 'all' ? 'All time' : 
                 activeFilter === 'upcoming' ? 'Upcoming' : 'Past';
    }
    
    if (selectedServices.length === 0) {
      summary += ' • No services';
    } else if (selectedServices.length < services.length) {
      summary += ` • ${selectedServices.length} service${selectedServices.length !== 1 ? 's' : ''}`;
    }
    
    return summary;
  };

  const onDatePickerChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Your Schedule</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
            <Filter size={20} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Today: {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.filterSummary}>{getFilterSummary()}</Text>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <ChevronUp size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Time Period Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Time Period</Text>
            <View style={styles.timeFilters}>
              <TouchableOpacity
                style={[styles.timeFilterButton, activeFilter === 'all' && styles.activeTimeFilter]}
                onPress={() => setActiveFilter('all')}
              >
                <Text style={[styles.timeFilterText, activeFilter === 'all' && styles.activeTimeFilterText]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeFilterButton, activeFilter === 'upcoming' && styles.activeTimeFilter]}
                onPress={() => setActiveFilter('upcoming')}
              >
                <Text style={[styles.timeFilterText, activeFilter === 'upcoming' && styles.activeTimeFilterText]}>
                  Upcoming
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeFilterButton, activeFilter === 'past' && styles.activeTimeFilter]}
                onPress={() => setActiveFilter('past')}
              >
                <Text style={[styles.timeFilterText, activeFilter === 'past' && styles.activeTimeFilterText]}>
                  Past
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Specific Date</Text>
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
                <X size={14} color="#EF4444" />
                <Text style={styles.clearDateText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Services Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Services</Text>
            {services.map(service => (
              <View key={service.id} style={styles.serviceItem}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDuration}>{service.duration} min</Text>
                </View>
                <Switch
                  value={selectedServices.includes(service.id)}
                  onValueChange={() => handleServiceToggle(service.id)}
                  trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                  thumbColor={selectedServices.includes(service.id) ? '#8B5CF6' : '#F3F4F6'}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.content}>
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointment}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
            />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={filteredAppointments.length === 0 ? styles.emptyContainer : undefined}
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={onDatePickerChange}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6'
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4
  },
  filterSummary: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500'
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingBottom: 16
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937'
  },
  filterSection: {
    marginBottom: 16
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  timeFilters: {
    flexDirection: 'row',
    gap: 8
  },
  timeFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  activeTimeFilter: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6'
  },
  timeFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280'
  },
  activeTimeFilterText: {
    color: 'white'
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  clearDateText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center'
  }
});