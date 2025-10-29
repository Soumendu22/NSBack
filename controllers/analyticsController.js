// controllers/analyticsController.js
const { supabase } = require('../config/database');

// GET USER REGISTRATION TRENDS - For analytics dashboard (organization-specific)
const getUserTrends = async (req, res) => {
  try {
    const { timeRange = '30', adminUserId } = req.query; // days
    const days = parseInt(timeRange);

    console.log(`Fetching user registration trends for last ${days} days for admin: ${adminUserId}`);

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get admin's organization info
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('username, company_name')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error('Admin user not found:', adminError);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    console.log('Admin user found:', adminUser);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    // Query user registrations by date for admin's organization only
    // Use company_name as the organization filter since that's what endpoint users register with
    const organizationFilter = adminUser.company_name || adminUser.username;
    console.log('Using organization filter:', organizationFilter);

    const { data: users, error } = await supabase
      .from('endpoint_users')
      .select('created_at, is_approved, organization_company_name')
      .eq('organization_company_name', organizationFilter)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    console.log('Users query result:', { users: users?.length || 0, error });

    // If no users found with company_name, try with username as fallback
    if (!users || users.length === 0) {
      console.log('No users found with company_name, trying username fallback...');
      const { data: fallbackUsers, error: fallbackError } = await supabase
        .from('endpoint_users')
        .select('created_at, is_approved, organization_company_name')
        .ilike('organization_company_name', `%${adminUser.username}%`)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      console.log('Fallback query result:', { fallbackUsers: fallbackUsers?.length || 0, fallbackError });

      if (fallbackUsers && fallbackUsers.length > 0) {
        users = fallbackUsers;
      }
    }

    if (error) {
      console.error('Error fetching user trends:', error);
      return res.status(500).json({ error: 'Failed to fetch user trends' });
    }

    // Group by date
    const trendData = {};
    const dateRange = [];

    // Initialize all dates in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dateRange.push(dateKey);
      trendData[dateKey] = {
        date: dateKey,
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
      };
    }

    // Count registrations by date and status
    users.forEach(user => {
      const dateKey = user.created_at.split('T')[0];
      if (trendData[dateKey]) {
        trendData[dateKey].total++;
        if (user.is_approved === true) {
          trendData[dateKey].approved++;
        } else if (user.is_approved === false) {
          trendData[dateKey].rejected++;
        } else {
          trendData[dateKey].pending++;
        }
      }
    });

    const result = dateRange.map(date => trendData[date]);

    res.status(200).json({
      timeRange: days,
      data: result
    });

  } catch (error) {
    console.error('Error in user trends endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// GET DEPARTMENT DISTRIBUTION - For analytics dashboard (organization-specific)
const getOrganizationDistribution = async (req, res) => {
  try {
    const { adminUserId } = req.query;
    console.log(`Fetching department distribution for admin: ${adminUserId}`);

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get admin's organization
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('username, company_name')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error('Admin user not found:', adminError);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    console.log('Admin user found:', adminUser);

    // Query users in admin's organization, group by operating system or department
    const { data: orgData, error } = await supabase
      .from('endpoint_users')
      .select('operating_system, is_approved, full_name, organization_company_name')
      .eq('organization_company_name', adminUser.company_name || adminUser.username)
      .not('operating_system', 'is', null);

    console.log('Organization data query result:', { orgData: orgData?.length || 0, error });

    if (error) {
      console.error('Error fetching department distribution:', error);
      return res.status(500).json({ error: 'Failed to fetch department distribution' });
    }

    // Count users by operating system (as department/team indicator)
    const deptCounts = {};
    orgData.forEach(user => {
      const deptName = user.operating_system || 'Unknown';
      if (!deptCounts[deptName]) {
        deptCounts[deptName] = {
          name: deptName,
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        };
      }

      deptCounts[deptName].total++;
      if (user.is_approved === true) {
        deptCounts[deptName].approved++;
      } else if (user.is_approved === false) {
        deptCounts[deptName].rejected++;
      } else {
        deptCounts[deptName].pending++;
      }
    });

    // Convert to array and sort by total users
    const result = Object.values(deptCounts)
      .sort((a, b) => b.total - a.total);

    res.status(200).json({
      data: result,
      organizationName: adminUser.company_name || adminUser.username
    });

  } catch (error) {
    console.error('Error in organization distribution endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// GET APPROVAL STATUS OVERVIEW - For analytics dashboard (organization-specific)
const getApprovalStatus = async (req, res) => {
  try {
    const { adminUserId } = req.query;
    console.log(`Fetching approval status overview for admin: ${adminUserId}`);

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get admin's organization
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('username, company_name')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error('Admin user not found:', adminError);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    console.log('Admin user found:', adminUser);

    // Query approval status counts for admin's organization only
    const { data: statusData, error } = await supabase
      .from('endpoint_users')
      .select('is_approved, created_at, organization_company_name')
      .eq('organization_company_name', adminUser.company_name || adminUser.username);

    console.log('Status data query result:', { statusData: statusData?.length || 0, error });

    if (error) {
      console.error('Error fetching approval status:', error);
      return res.status(500).json({ error: 'Failed to fetch approval status' });
    }

    // Count by status
    const statusCounts = {
      approved: 0,
      pending: 0,
      rejected: 0,
      total: statusData.length
    };

    statusData.forEach(user => {
      if (user.is_approved === true) {
        statusCounts.approved++;
      } else if (user.is_approved === false) {
        statusCounts.rejected++;
      } else {
        statusCounts.pending++;
      }
    });

    // Calculate percentages
    const result = {
      approved: {
        count: statusCounts.approved,
        percentage: statusData.length > 0 ? Math.round((statusCounts.approved / statusData.length) * 100) : 0
      },
      pending: {
        count: statusCounts.pending,
        percentage: statusData.length > 0 ? Math.round((statusCounts.pending / statusData.length) * 100) : 0
      },
      rejected: {
        count: statusCounts.rejected,
        percentage: statusData.length > 0 ? Math.round((statusCounts.rejected / statusData.length) * 100) : 0
      },
      total: statusCounts.total
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Error in approval status endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// GET ORGANIZATION STATUS METRICS - For analytics dashboard (organization-specific)
const getSystemStatus = async (req, res) => {
  try {
    const { adminUserId } = req.query;
    console.log(`Fetching organization status metrics for admin: ${adminUserId}`);

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get admin's organization
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('username, company_name')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error('Admin user not found:', adminError);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    console.log('Admin user found:', adminUser);

    // Get total users count in admin's organization
    const { count: totalUsers, error: usersError } = await supabase
      .from('endpoint_users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_company_name', adminUser.company_name || adminUser.username);

    if (usersError) {
      console.error('Error counting users:', usersError);
    }

    console.log('Total users count:', totalUsers);

    // Get active endpoints (approved users) in admin's organization
    const { count: activeEndpoints, error: endpointsError } = await supabase
      .from('endpoint_users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_company_name', adminUser.company_name || adminUser.username)
      .eq('is_approved', true);

    if (endpointsError) {
      console.error('Error counting active endpoints:', endpointsError);
    }

    console.log('Active endpoints count:', activeEndpoints);

    // Get unique operating systems in admin's organization (as departments)
    const { data: osData, error: osError } = await supabase
      .from('endpoint_users')
      .select('operating_system')
      .eq('organization_company_name', adminUser.company_name || adminUser.username)
      .not('operating_system', 'is', null);

    if (osError) {
      console.error('Error fetching OS data:', osError);
    }

    const uniqueDepartments = osData ? new Set(osData.map(u => u.operating_system)).size : 0;
    console.log('Unique departments count:', uniqueDepartments);

    // Check Wazuh integration status for this admin
    const { data: wazuhData, error: wazuhError } = await supabase
      .from('users')
      .select('wazuh_username')
      .eq('id', adminUserId)
      .not('wazuh_username', 'is', null)
      .limit(1);

    const wazuhIntegrated = wazuhData && wazuhData.length > 0;

    const result = {
      totalUsers: totalUsers || 0,
      activeEndpoints: activeEndpoints || 0,
      totalDepartments: uniqueDepartments,
      organizationName: adminUser.company_name || adminUser.username,
      wazuhIntegrated: wazuhIntegrated,
      systemHealth: 'operational', // Could be enhanced with actual health checks
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Error in system status endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// GET RECENT ACTIVITY - For analytics dashboard (organization-specific)
const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10, adminUserId } = req.query;
    console.log(`Fetching recent activity (limit: ${limit}) for admin: ${adminUserId}`);

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get admin's organization
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('username, company_name')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error('Admin user not found:', adminError);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    console.log('Admin user found:', adminUser);

    // Get recent user registrations and updates in admin's organization
    const { data: recentUsers, error } = await supabase
      .from('endpoint_users')
      .select('full_name, organization_company_name, is_approved, created_at, updated_at, operating_system')
      .eq('organization_company_name', adminUser.company_name || adminUser.username)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    console.log('Recent users query result:', { recentUsers: recentUsers?.length || 0, error });

    if (error) {
      console.error('Error fetching recent activity:', error);
      return res.status(500).json({ error: 'Failed to fetch recent activity' });
    }

    // Format activity data
    const activities = recentUsers.map(user => {
      let activityType = 'registration';
      let status = 'pending';
      let timestamp = user.created_at;

      if (user.is_approved === true) {
        activityType = 'approval';
        status = 'approved';
        timestamp = user.updated_at || user.created_at;
      } else if (user.is_approved === false) {
        activityType = 'rejection';
        status = 'rejected';
        timestamp = user.updated_at || user.created_at;
      }

      return {
        id: `${user.full_name}-${timestamp}`,
        type: activityType,
        status: status,
        user: user.full_name,
        organization: user.organization_company_name,
        timestamp: timestamp,
        description: `${user.full_name} from ${user.organization_company_name} - ${activityType}`
      };
    });

    res.status(200).json({
      data: activities
    });

  } catch (error) {
    console.error('Error in recent activity endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// GET DEVICE ANALYTICS - For analytics dashboard (organization-specific)
const getDeviceAnalytics = async (req, res) => {
  try {
    const { adminUserId } = req.query;
    console.log(`Fetching device analytics for admin: ${adminUserId}`);

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get admin's organization
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('username, company_name')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error('Admin user not found:', adminError);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    console.log('Admin user found:', adminUser);

    // Query device/OS distribution with trends
    const { data: deviceData, error } = await supabase
      .from('endpoint_users')
      .select('operating_system, created_at, is_approved')
      .eq('organization_company_name', adminUser.company_name || adminUser.username)
      .not('operating_system', 'is', null);

    console.log('Device data query result:', { deviceData: deviceData?.length || 0, error });

    if (error) {
      console.error('Error fetching device analytics:', error);
      return res.status(500).json({ error: 'Failed to fetch device analytics' });
    }

    // Calculate current and previous period data
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const deviceCounts = {};
    const currentPeriodCounts = {};
    const previousPeriodCounts = {};

    deviceData.forEach(user => {
      const device = user.operating_system || 'Unknown';
      const userDate = new Date(user.created_at);

      // Total counts
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;

      // Current period (last 7 days)
      if (userDate >= weekAgo) {
        currentPeriodCounts[device] = (currentPeriodCounts[device] || 0) + 1;
      }

      // Previous period (7-14 days ago)
      if (userDate >= twoWeeksAgo && userDate < weekAgo) {
        previousPeriodCounts[device] = (previousPeriodCounts[device] || 0) + 1;
      }
    });

    // Calculate trends and percentages
    const totalUsers = deviceData.length;
    const result = Object.keys(deviceCounts).map(device => {
      const count = deviceCounts[device];
      const currentCount = currentPeriodCounts[device] || 0;
      const previousCount = previousPeriodCounts[device] || 0;
      
      const change = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 
                    currentCount > 0 ? 100 : 0;
      
      const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';

      return {
        device,
        count,
        percentage: Math.round((count / totalUsers) * 100),
        trend,
        change: Math.round(change)
      };
    });

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    res.status(200).json({
      data: result,
      organizationName: adminUser.company_name || adminUser.username
    });

  } catch (error) {
    console.error('Error in device analytics endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// GET HOURLY ACTIVITY - For analytics dashboard (organization-specific)
const getHourlyActivity = async (req, res) => {
  try {
    const { adminUserId } = req.query;
    console.log(`Fetching hourly activity for admin: ${adminUserId}`);

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get admin's organization
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('username, company_name')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error('Admin user not found:', adminError);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Query recent activity by hour
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const { data: activityData, error } = await supabase
      .from('endpoint_users')
      .select('created_at, updated_at')
      .eq('organization_company_name', adminUser.company_name || adminUser.username)
      .gte('created_at', last7Days.toISOString());

    console.log('Hourly activity query result:', { activityData: activityData?.length || 0, error });

    if (error) {
      console.error('Error fetching hourly activity:', error);
      return res.status(500).json({ error: 'Failed to fetch hourly activity' });
    }

    // Initialize hourly buckets
    const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
      time: i.toString().padStart(2, '0') + ':00',
      value: 0
    }));

    // Count activity by hour
    activityData.forEach(user => {
      const hour = new Date(user.created_at).getHours();
      hourlyActivity[hour].value++;

      // Also count updates if available
      if (user.updated_at && user.updated_at !== user.created_at) {
        const updateHour = new Date(user.updated_at).getHours();
        hourlyActivity[updateHour].value++;
      }
    });

    res.status(200).json({
      data: hourlyActivity
    });

  } catch (error) {
    console.error('Error in hourly activity endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// GET SECURITY METRICS - For analytics dashboard (organization-specific)
const getSecurityMetrics = async (req, res) => {
  try {
    const { adminUserId } = req.query;
    console.log(`Fetching security metrics for admin: ${adminUserId}`);

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get admin's organization
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('username, company_name, wazuh_username')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error('Admin user not found:', adminError);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Get organization users for security analysis
    const { data: orgUsers, error: usersError } = await supabase
      .from('endpoint_users')
      .select('is_approved, created_at, updated_at')
      .eq('organization_company_name', adminUser.company_name || adminUser.username);

    if (usersError) {
      console.error('Error fetching organization users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch organization users' });
    }

    // Calculate security metrics
    const totalUsers = orgUsers.length;
    const approvedUsers = orgUsers.filter(u => u.is_approved === true).length;
    const pendingUsers = orgUsers.filter(u => u.is_approved === null).length;
    const rejectedUsers = orgUsers.filter(u => u.is_approved === false).length;

    // Calculate security score based on various factors
    let securityScore = 50; // Base score

    // Wazuh integration bonus
    if (adminUser.wazuh_username) {
      securityScore += 25;
    }

    // Approval rate bonus
    const approvalRate = totalUsers > 0 ? (approvedUsers / totalUsers) : 0;
    securityScore += Math.round(approvalRate * 20);

    // Pending users penalty
    const pendingRate = totalUsers > 0 ? (pendingUsers / totalUsers) : 0;
    securityScore -= Math.round(pendingRate * 15);

    // Cap the score
    securityScore = Math.max(0, Math.min(100, securityScore));

    // Determine threat level
    let threatLevel = 'low';
    if (securityScore < 60) {
      threatLevel = 'high';
    } else if (securityScore < 80) {
      threatLevel = 'medium';
    }

    // Simulate vulnerabilities (in a real implementation, this would come from actual security scans)
    const vulnerabilities = Math.max(0, Math.floor((100 - securityScore) / 20));

    const result = {
      threatLevel,
      securityScore,
      vulnerabilities,
      lastScan: new Date().toISOString(),
      incidents: 0, // Would be calculated from real incident data
      wazuhIntegrated: !!adminUser.wazuh_username,
      approvalRate: Math.round(approvalRate * 100),
      pendingRate: Math.round(pendingRate * 100)
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Error in security metrics endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// GET GROWTH METRICS - For analytics dashboard (organization-specific)
const getGrowthMetrics = async (req, res) => {
  try {
    const { adminUserId, timeRange = '30' } = req.query;
    const days = parseInt(timeRange);
    console.log(`Fetching growth metrics for admin: ${adminUserId}, timeRange: ${days} days`);

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get admin's organization
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('username, company_name')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error('Admin user not found:', adminError);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Calculate date ranges
    const endDate = new Date();
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
    
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - days);

    // Get current period data
    const { data: currentData, error: currentError } = await supabase
      .from('endpoint_users')
      .select('created_at')
      .eq('organization_company_name', adminUser.company_name || adminUser.username)
      .gte('created_at', currentPeriodStart.toISOString())
      .lte('created_at', endDate.toISOString());

    // Get previous period data
    const { data: previousData, error: previousError } = await supabase
      .from('endpoint_users')
      .select('created_at')
      .eq('organization_company_name', adminUser.company_name || adminUser.username)
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', previousPeriodEnd.toISOString());

    if (currentError || previousError) {
      console.error('Error fetching growth data:', { currentError, previousError });
      return res.status(500).json({ error: 'Failed to fetch growth metrics' });
    }

    const currentPeriod = currentData?.length || 0;
    const previousPeriod = previousData?.length || 0;
    
    const growthRate = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 
                      currentPeriod > 0 ? 100 : 0;
    
    const trend = growthRate > 5 ? 'up' : growthRate < -5 ? 'down' : 'stable';

    const result = {
      currentPeriod,
      previousPeriod,
      growthRate: Math.round(growthRate * 10) / 10, // Round to 1 decimal
      trend,
      timeRange: days
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Error in growth metrics endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

module.exports = { 
  getUserTrends, 
  getOrganizationDistribution, 
  getApprovalStatus, 
  getSystemStatus, 
  getRecentActivity,
  getDeviceAnalytics,
  getHourlyActivity,
  getSecurityMetrics,
  getGrowthMetrics
};
