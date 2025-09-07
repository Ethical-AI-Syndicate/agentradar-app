import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';

import { useAuth } from '../contexts/AuthContext';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatsCard } from '../components/StatsCard';
import { AlertCard } from '../components/AlertCard';
import { PropertyCard } from '../components/PropertyCard';
import { apiService } from '../services/apiService';
import { colors } from '../styles/theme';

const { width } = Dimensions.get('window');

interface DashboardData {
  stats: {
    totalAlerts: number;
    activeAlerts: number;
    highPriorityAlerts: number;
    savedProperties: number;
    favoriteProperties: number;
    totalValue: number;
    averageROI: number;
    marketTrend: number;
  };
  recentAlerts: any[];
  savedProperties: any[];
  marketData: {
    labels: string[];
    datasets: [{ data: number[] }];
  };
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsResponse, alertsResponse, propertiesResponse] = await Promise.allSettled([
        apiService.getDashboardStats(),
        apiService.getAlerts({ limit: 5 }),
        apiService.getSavedProperties({ limit: 5, isFavorite: true }),
      ]);

      const dashboardData: DashboardData = {
        stats: {
          totalAlerts: 0,
          activeAlerts: 0,
          highPriorityAlerts: 0,
          savedProperties: 0,
          favoriteProperties: 0,
          totalValue: 0,
          averageROI: 0,
          marketTrend: 0,
        },
        recentAlerts: [],
        savedProperties: [],
        marketData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{ data: [650000, 670000, 690000, 720000, 750000, 780000] }],
        },
      };

      // Handle stats
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        dashboardData.stats = { ...dashboardData.stats, ...statsResponse.value.data };
      }

      // Handle alerts
      if (alertsResponse.status === 'fulfilled' && alertsResponse.value.success) {
        dashboardData.recentAlerts = alertsResponse.value.data;
        dashboardData.stats.totalAlerts = alertsResponse.value.data.length;
        dashboardData.stats.activeAlerts = alertsResponse.value.data.filter(
          (alert: any) => alert.status === 'ACTIVE'
        ).length;
        dashboardData.stats.highPriorityAlerts = alertsResponse.value.data.filter(
          (alert: any) => alert.priority === 'HIGH' || alert.priority === 'URGENT'
        ).length;
      }

      // Handle properties
      if (propertiesResponse.status === 'fulfilled' && propertiesResponse.value.success) {
        dashboardData.savedProperties = propertiesResponse.value.data;
        dashboardData.stats.savedProperties = propertiesResponse.value.data.length;
        dashboardData.stats.favoriteProperties = propertiesResponse.value.data.filter(
          (prop: any) => prop.isFavorite
        ).length;
        dashboardData.stats.totalValue = propertiesResponse.value.data.reduce(
          (sum: number, prop: any) => sum + (prop.price || 0),
          0
        );
        if (dashboardData.savedProperties.length > 0) {
          dashboardData.stats.averageROI =
            dashboardData.stats.totalValue / dashboardData.savedProperties.length;
        }
      }

      setData(dashboardData);
    } catch (error) {
      console.error('Dashboard loading error:', error);
      showMessage({
        message: 'Error loading dashboard',
        description: 'Please try again later',
        type: 'danger',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    loadDashboardData(true);
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader
        userName={user?.firstName || 'User'}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <StatsCard
            title="Active Alerts"
            value={data?.stats.activeAlerts || 0}
            icon="bell"
            color={colors.warning}
          />
          <StatsCard
            title="Properties"
            value={data?.stats.savedProperties || 0}
            icon="home"
            color={colors.primary}
          />
          <StatsCard
            title="High Priority"
            value={data?.stats.highPriorityAlerts || 0}
            icon="alert"
            color={colors.error}
          />
          <StatsCard
            title="Favorites"
            value={data?.stats.favoriteProperties || 0}
            icon="heart"
            color={colors.success}
          />
        </View>

        {/* Market Trend Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Market Trend</Title>
            <Paragraph style={styles.cardSubtitle}>
              Average property values in your area
            </Paragraph>
            {data?.marketData && (
              <LineChart
                data={data.marketData}
                width={width - 64}
                height={200}
                chartConfig={{
                  backgroundColor: colors.primary,
                  backgroundGradientFrom: colors.primary,
                  backgroundGradientTo: colors.secondary,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: colors.accent,
                  },
                }}
                bezier
                style={styles.chart}
              />
            )}
            <View style={styles.trendIndicator}>
              <MaterialCommunityIcons
                name="trending-up"
                size={20}
                color={colors.success}
              />
              <Paragraph style={styles.trendText}>
                +{data?.stats.marketTrend || 5.2}% this quarter
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Alerts */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.cardTitle}>Recent Alerts</Title>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Alerts')}
                compact
              >
                View All
              </Button>
            </View>
            {data?.recentAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={48}
                  color={colors.disabled}
                />
                <Paragraph style={styles.emptyText}>No alerts yet</Paragraph>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('CreateAlert')}
                  style={styles.emptyButton}
                >
                  Create First Alert
                </Button>
              </View>
            ) : (
              data?.recentAlerts.slice(0, 3).map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onPress={() =>
                    navigation.navigate('AlertDetail', { alertId: alert.id })
                  }
                  style={styles.alertCard}
                />
              ))
            )}
          </Card.Content>
        </Card>

        {/* Saved Properties */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.cardTitle}>Favorite Properties</Title>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Properties')}
                compact
              >
                View All
              </Button>
            </View>
            {data?.savedProperties.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="home-outline"
                  size={48}
                  color={colors.disabled}
                />
                <Paragraph style={styles.emptyText}>No saved properties</Paragraph>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Search')}
                  style={styles.emptyButton}
                >
                  Search Properties
                </Button>
              </View>
            ) : (
              data?.savedProperties.slice(0, 3).map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onPress={() =>
                    navigation.navigate('PropertyDetail', { propertyId: property.id })
                  }
                  style={styles.propertyCard}
                />
              ))
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            <View style={styles.quickActions}>
              <Button
                mode="outlined"
                icon="magnify"
                onPress={() => navigation.navigate('Search')}
                style={styles.actionButton}
              >
                Search
              </Button>
              <Button
                mode="outlined"
                icon="bell-plus"
                onPress={() => navigation.navigate('CreateAlert')}
                style={styles.actionButton}
              >
                New Alert
              </Button>
              <Button
                mode="outlined"
                icon="map"
                onPress={() =>
                  navigation.navigate('Map', {
                    alerts: data?.recentAlerts,
                    properties: data?.savedProperties,
                  })
                }
                style={styles.actionButton}
              >
                Map View
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateAlert')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  chartCard: {
    margin: 16,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    marginLeft: 8,
    color: colors.success,
    fontWeight: '500',
  },
  sectionCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
  alertCard: {
    marginBottom: 8,
  },
  propertyCard: {
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  bottomSpacing: {
    height: 80,
  },
});