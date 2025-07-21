// screens/UsageStatsCard.js - Focused solely on analytics and usage statistics

import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  BarChart3,
  Users,
  Zap,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Activity,
  PieChart,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react-native';

// Enhanced progress bar with animation
function ProgressBar({ progress, color = '#000000', showPercentage = true }) {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: color }]} />
      </View>
      {showPercentage && (
        <Text style={[styles.progressText, { color }]}>{Math.round(progress)}%</Text>
      )}
    </View>
  );
}

// Enhanced stat card with trends
function StatCard({ icon, title, value, change, changeType, description, children, style }) {
  const getTrendIcon = () => {
    if (changeType === 'increase') return <TrendingUp size={14} color="#10B981" />;
    if (changeType === 'decrease') return <TrendingDown size={14} color="#EF4444" />;
    return null;
  };

  const getTrendColor = () => {
    if (changeType === 'increase') return '#10B981';
    if (changeType === 'decrease') return '#EF4444';
    return '#6B7280';
  };

  return (
    <View style={[styles.statCard, style]}>
      <View style={styles.statCardHeader}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {change && (
        <View style={styles.changeContainer}>
          {getTrendIcon()}
          <Text style={[styles.changeText, { color: getTrendColor() }]}>
            {change}
          </Text>
        </View>
      )}
      {description && <Text style={styles.statDescription}>{description}</Text>}
      {children}
    </View>
  );
}

export default function UsageStatsCard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = () => {
    setIsLoading(true);
    setTimeout(() => {
      setStats({
        overview: {
          totalQueries: 1247,
          activeUsers: 8,
          totalUsers: 12,
          avgResponseTime: 2.3,
          peakConcurrentUsers: 5,
          uptime: 99.2,
        },
        previousPeriod: {
          totalQueries: 892,
          activeUsers: 6,
          avgResponseTime: 2.8,
          peakConcurrentUsers: 3,
        },
        dailyUsage: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          queries: Math.floor(Math.random() * 100) + 20,
          activeUsers: Math.floor(Math.random() * 8) + 2,
          avgResponseTime: Math.random() * 2 + 1.5,
        })),
        hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          queries: Math.floor(Math.random() * 50) + 10,
          users: Math.floor(Math.random() * 5) + 1,
        })),
        topUsers: [
          { name: 'John Doe', queries: 156, department: 'Engineering' },
          { name: 'Jane Smith', queries: 134, department: 'Engineering' },
          { name: 'Mike Johnson', queries: 89, department: 'Design' },
          { name: 'Sarah Wilson', queries: 67, department: 'Engineering' },
        ],
        queryCategories: [
          { category: 'Technical Support', count: 456, percentage: 36.6 },
          { category: 'Documentation', count: 321, percentage: 25.7 },
          { category: 'Code Review', count: 234, percentage: 18.8 },
          { category: 'Troubleshooting', count: 156, percentage: 12.5 },
          { category: 'General Questions', count: 80, percentage: 6.4 },
        ],
        performanceMetrics: {
          avgQueryLength: 45,
          avgResponseLength: 234,
          satisfactionScore: 4.3,
          errorRate: 0.8,
        }
      });
      setIsLoading(false);
      setIsRefreshing(false);
    }, 1000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadStats();
  };

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getChangeType = (growth) => {
    if (growth > 0) return 'increase';
    if (growth < 0) return 'decrease';
    return 'neutral';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!stats) return null;

  const { overview, previousPeriod, dailyUsage, hourlyDistribution, topUsers, queryCategories, performanceMetrics } = stats;
  
  const queryGrowth = calculateGrowth(overview.totalQueries, previousPeriod.totalQueries);
  const userGrowth = calculateGrowth(overview.activeUsers, previousPeriod.activeUsers);
  const responseTimeGrowth = calculateGrowth(previousPeriod.avgResponseTime, overview.avgResponseTime); // Inverted for response time
  
  const recentDays = dailyUsage.slice(-7);
  const userActivityPercentage = Math.round((overview.activeUsers / overview.totalUsers) * 100);

  const timeRangeOptions = [
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Controls */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Usage Analytics</Text>
          <Text style={styles.headerSubtitle}>Comprehensive usage insights and performance metrics</Text>
        </View>
        <View style={styles.headerControls}>
          <TouchableOpacity 
            style={[styles.refreshButton, isRefreshing && styles.refreshButtonActive]}
            onPress={handleRefresh}
          >
            <RefreshCw size={16} color="#666666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton}>
            <Download size={16} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeCard}>
        <View style={styles.timeRangeHeader}>
          <Filter size={16} color="#000000" />
          <Text style={styles.timeRangeTitle}>Time Range</Text>
        </View>
        <View style={styles.timeRangeOptions}>
          {timeRangeOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.timeRangeOption,
                timeRange === option.id && styles.timeRangeOptionActive
              ]}
              onPress={() => setTimeRange(option.id)}
            >
              <Text style={[
                styles.timeRangeOptionText,
                timeRange === option.id && styles.timeRangeOptionTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <StatCard
          icon={<Zap size={22} color="#000000" />}
          title="Total Queries"
          value={overview.totalQueries.toLocaleString()}
          change={`${queryGrowth > 0 ? '+' : ''}${queryGrowth}%`}
          changeType={getChangeType(queryGrowth)}
          description="vs previous period"
          style={styles.metricCard}
        />
        <StatCard
          icon={<Users size={22} color="#000000" />}
          title="Active Users"
          value={`${overview.activeUsers}/${overview.totalUsers}`}
          change={`${userGrowth > 0 ? '+' : ''}${userGrowth}%`}
          changeType={getChangeType(userGrowth)}
          description="team engagement"
          style={styles.metricCard}
        />
        <StatCard
          icon={<Clock size={22} color="#000000" />}
          title="Avg Response Time"
          value={`${overview.avgResponseTime}s`}
          change={`${responseTimeGrowth > 0 ? '+' : ''}${responseTimeGrowth}%`}
          changeType={getChangeType(-responseTimeGrowth)} // Inverted for response time
          description="system performance"
          style={styles.metricCard}
        />
        <StatCard
          icon={<Activity size={22} color="#000000" />}
          title="System Uptime"
          value={`${overview.uptime}%`}
          change=""
          changeType="neutral"
          description="service availability"
          style={styles.metricCard}
        />
      </View>

      {/* Main Analytics Dashboard */}
      <View style={styles.analyticsCard}>
        {/* Daily Usage Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Usage Trends</Text>
          <View style={styles.usageChart}>
            {recentDays.map((day, idx) => {
              const maxQueries = Math.max(...recentDays.map(d => d.queries));
              const barHeight = Math.max((day.queries / maxQueries) * 100, 10);
              const dateObj = new Date(day.date);
              const dateLabel = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              
              return (
                <View key={day.date} style={styles.usageDay}>
                  <Text style={styles.usageDayLabel}>{dateLabel}</Text>
                  <View style={styles.usageBarContainer}>
                    <View 
                      style={[
                        styles.usageBar, 
                        { height: `${barHeight}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.usageDayValue}>{day.queries}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Activity Heatmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>24-Hour Activity Pattern</Text>
          <View style={styles.heatmapContainer}>
            {hourlyDistribution.map((hour, idx) => {
              const maxQueries = Math.max(...hourlyDistribution.map(h => h.queries));
              const intensity = (hour.queries / maxQueries) * 100;
              const getIntensityColor = (intensity) => {
                if (intensity > 80) return '#000000';
                if (intensity > 60) return '#374151';
                if (intensity > 40) return '#6B7280';
                if (intensity > 20) return '#9CA3AF';
                return '#E5E7EB';
              };
              
              return (
                <View key={idx} style={styles.heatmapItem}>
                  <View 
                    style={[
                      styles.heatmapBlock,
                      { backgroundColor: getIntensityColor(intensity) }
                    ]}
                  />
                  <Text style={styles.heatmapHour}>
                    {hour.hour.toString().padStart(2, '0')}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.heatmapLegend}>
            Darker blocks indicate higher query volume during that hour
          </Text>
        </View>

        {/* User Engagement */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>User Engagement</Text>
            <Text style={styles.sectionValue}>{userActivityPercentage}% active</Text>
          </View>
          <ProgressBar progress={userActivityPercentage} />
          <View style={styles.engagementDetails}>
            <Text style={styles.engagementText}>
              {overview.activeUsers} of {overview.totalUsers} team members actively used the system
            </Text>
          </View>
        </View>

        {/* Top Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Active Users</Text>
          <View style={styles.topUsersList}>
            {topUsers.map((user, idx) => (
              <View key={idx} style={styles.topUserItem}>
                <View style={styles.topUserRank}>
                  <Text style={styles.topUserRankText}>#{idx + 1}</Text>
                </View>
                <View style={styles.topUserInfo}>
                  <Text style={styles.topUserName}>{user.name}</Text>
                  <Text style={styles.topUserDepartment}>{user.department}</Text>
                </View>
                <View style={styles.topUserStats}>
                  <Text style={styles.topUserQueries}>{user.queries}</Text>
                  <Text style={styles.topUserQueriesLabel}>queries</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Query Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Query Categories</Text>
          <View style={styles.categoriesList}>
            {queryCategories.map((category, idx) => (
              <View key={idx} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.category}</Text>
                  <Text style={styles.categoryCount}>{category.count} queries</Text>
                </View>
                <View style={styles.categoryProgress}>
                  <ProgressBar 
                    progress={category.percentage} 
                    color="#000000"
                    showPercentage={false}
                  />
                  <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Target size={20} color="#000000" />
              <Text style={styles.performanceLabel}>Avg Query Length</Text>
              <Text style={styles.performanceValue}>{performanceMetrics.avgQueryLength} words</Text>
            </View>
            <View style={styles.performanceItem}>
              <BarChart3 size={20} color="#000000" />
              <Text style={styles.performanceLabel}>Avg Response Length</Text>
              <Text style={styles.performanceValue}>{performanceMetrics.avgResponseLength} words</Text>
            </View>
            <View style={styles.performanceItem}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.performanceLabel}>Satisfaction Score</Text>
              <Text style={styles.performanceValue}>{performanceMetrics.satisfactionScore}/5.0</Text>
            </View>
            <View style={styles.performanceItem}>
              <Activity size={20} color="#EF4444" />
              <Text style={styles.performanceLabel}>Error Rate</Text>
              <Text style={styles.performanceValue}>{performanceMetrics.errorRate}%</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  refreshButtonActive: {
    backgroundColor: '#E5E7EB',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Time Range Card
  timeRangeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  timeRangeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  timeRangeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeOption: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeRangeOptionActive: {
    backgroundColor: '#000000',
  },
  timeRangeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  timeRangeOptionTextActive: {
    color: '#FFFFFF',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statTitle: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '600',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
    lineHeight: 32,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statDescription: {
    fontSize: 12,
    color: '#999999',
  },

  // Progress Bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },

  // Main Analytics Card
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  engagementDetails: {
    marginTop: 12,
  },
  engagementText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },

  // Usage Chart
  usageChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  usageDay: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  usageDayLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 8,
  },
  usageBarContainer: {
    flex: 1,
    width: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  usageBar: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 10,
    minHeight: 8,
  },
  usageDayValue: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '600',
    marginTop: 8,
  },

  // Heatmap
  heatmapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 4,
  },
  heatmapItem: {
    alignItems: 'center',
    width: (width - 120) / 12, // Responsive width for 12 items per row
  },
  heatmapBlock: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  heatmapHour: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  heatmapLegend: {
    fontSize: 12,
    color: '#999999',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Top Users
  topUsersList: {
    marginTop: 16,
    gap: 12,
  },
  topUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 10,
  },
  topUserRank: {
    width: 32,
    height: 32,
    backgroundColor: '#000000',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topUserRankText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  topUserInfo: {
    flex: 1,
  },
  topUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  topUserDepartment: {
    fontSize: 13,
    color: '#666666',
  },
  topUserStats: {
    alignItems: 'flex-end',
  },
  topUserQueries: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  topUserQueriesLabel: {
    fontSize: 12,
    color: '#666666',
  },

  // Categories
  categoriesList: {
    marginTop: 16,
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 2,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 13,
    color: '#666666',
  },
  categoryProgress: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    minWidth: 35,
    textAlign: 'right',
  },

  // Performance Section
  performanceSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 16,
  },
  performanceItem: {
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  performanceValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '700',
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 40,
  },
});