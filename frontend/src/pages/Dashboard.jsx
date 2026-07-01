import React, { useState, useEffect, useContext } from 'react';
import { getDashboardStats } from '../services/api';
import { ThemeContext } from '../context/ThemeContext';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title 
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title
);

export default function Dashboard() {
  const { isDarkMode } = useContext(ThemeContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard statistics. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 py-5">
        <div className="spinner-border text-primary mb-3" role="status" style={{ borderRightColor: 'transparent' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-secondary small fw-semibold">Loading analytics suite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4 d-flex align-items-center gap-2 border-0 shadow-sm rounded-4" role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
        <i className="bi bi-exclamation-octagon-fill fs-4"></i>
        <div>
          <h5 className="alert-heading fw-bold mb-1">Server connection error</h5>
          <p className="mb-0 small">{error}</p>
          <button onClick={fetchStats} className="btn btn-outline-danger btn-sm mt-3 rounded-3 px-3">
            <i className="bi bi-arrow-clockwise me-1"></i> Retry connecting
          </button>
        </div>
      </div>
    );
  }

  const sourceLabels = {
    facebook: 'Facebook Ads',
    google: 'Google Search',
    organic: 'Organic Traffic'
  };

  const statusLabels = {
    new: 'Incoming',
    contacted: 'In Touch',
    qualified: 'Qualified',
    closed: 'Closed'
  };

  // Pie Chart Data: Lead Source (Dribbble Twilight accents)
  const sourceChartData = {
    labels: Object.keys(stats.source_distribution).map(k => sourceLabels[k] || k),
    datasets: [
      {
        data: Object.values(stats.source_distribution),
        backgroundColor: [
          'rgba(124, 58, 237, 0.85)', // Violet
          'rgba(6, 182, 212, 0.85)',  // Cyan
          'rgba(236, 72, 153, 0.85)',  // Fuchsia
        ],
        hoverBackgroundColor: [
          'rgba(124, 58, 237, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderColor: isDarkMode ? '#0d0e15' : '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // Bar Chart Data: Lead Status
  const statusChartData = {
    labels: Object.keys(stats.status_summary).map(k => statusLabels[k] || k),
    datasets: [
      {
        label: 'Leads count',
        data: Object.values(stats.status_summary),
        backgroundColor: [
          'rgba(124, 58, 237, 0.8)',  // Violet
          'rgba(245, 158, 11, 0.8)',  // Amber
          'rgba(16, 185, 129, 0.8)',  // Emerald
          'rgba(239, 68, 68, 0.8)',   // Rose
        ],
        hoverBackgroundColor: [
          'rgba(124, 58, 237, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#94a3b8' : '#64748b',
          font: {
            family: 'Plus Jakarta Sans',
            weight: '600',
            size: 11
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(15, 17, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#f8fafc' : '#0f172a',
        bodyColor: isDarkMode ? '#94a3b8' : '#64748b',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        cornerRadius: 8,
        usePointStyle: true
      }
    },
    scales: {
      y: {
        ticks: { 
          color: isDarkMode ? '#64748b' : '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 10, weight: '500' }
        },
        grid: { color: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
        border: { display: false }
      },
      x: {
        ticks: { 
          color: isDarkMode ? '#64748b' : '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 10, weight: '500' }
        },
        grid: { display: false },
        border: { display: false }
      }
    }
  };

  const conversionRate = stats.total_leads > 0 
    ? ((stats.status_summary.qualified / stats.total_leads) * 100).toFixed(1)
    : 0;

  return (
    <div className="position-relative container-fluid py-3 py-md-4 animate-fade-in">
      
      {/* Header section */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 position-relative" style={{ zIndex: 1 }}>
        <div>
          <h1 className="fw-extrabold tracking-tight mb-1" style={{ fontSize: '1.75rem' }}>Executive Overview</h1>
          <p className="text-secondary small mb-0">Real-time conversions, statistics, and advertising channel performance.</p>
        </div>
        <button onClick={fetchStats} className="btn btn-outline-primary btn-sm rounded-3 px-3 py-2 d-flex align-items-center gap-2">
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Bento Grid: Row 1 - Stats Cards */}
      <div className="row g-dashboard mb-4 position-relative" style={{ zIndex: 1 }}>
        
        {/* Stat card 1 */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card glass-card h-100 border-0">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-xxs fw-bold">Total Directory Leads</span>
                <h2 className="fw-extrabold mt-2 mb-0 stat-value">{stats.total_leads}</h2>
              </div>
              <div className="stat-icon-wrapper text-primary" style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                <i className="bi bi-people-fill"></i>
              </div>
            </div>
            <div className="mt-4 pt-1 d-flex align-items-center gap-1.5 text-success stat-subtext fw-semibold">
              <span className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle p-1" style={{ width: '18px', height: '18px' }}>
                <i className="bi bi-arrow-up-short fs-6"></i>
              </span>
              <span>All sync points running active</span>
            </div>
          </div>
        </div>

        {/* Stat card 2 */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card glass-card h-100 border-0">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-xxs fw-bold">Incoming Today</span>
                <h2 className="fw-extrabold mt-2 mb-0 stat-value">{stats.today_leads}</h2>
              </div>
              <div className="stat-icon-wrapper text-info" style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                <i className="bi bi-clock-history"></i>
              </div>
            </div>
            <div className="mt-4 pt-1 d-flex align-items-center gap-1.5 text-secondary stat-subtext">
              <span className="bg-info rounded-circle d-inline-block" style={{ width: '6px', height: '6px' }}></span>
              <span className="text-secondary ms-1 fw-medium">Refreshed minutes ago</span>
            </div>
          </div>
        </div>

        {/* Stat card 3 */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card glass-card h-100 border-0">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-xxs fw-bold">Conversion Rate</span>
                <h2 className="fw-extrabold mt-2 mb-0 stat-value">{conversionRate}%</h2>
              </div>
              <div className="stat-icon-wrapper text-success" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <i className="bi bi-graph-up-arrow"></i>
              </div>
            </div>
            <div className="mt-4 pt-1 d-flex align-items-center gap-1.5 text-success stat-subtext fw-semibold">
              <span>{stats.status_summary.qualified} qualified leads</span>
            </div>
          </div>
        </div>

        {/* Stat card 4 */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card glass-card h-100 border-0">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-secondary text-xxs fw-bold">Deals Closed</span>
                <h2 className="fw-extrabold mt-2 mb-0 stat-value">{stats.status_summary.closed}</h2>
              </div>
              <div className="stat-icon-wrapper text-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <i className="bi bi-shield-lock-fill"></i>
              </div>
            </div>
            <div className="mt-4 pt-1 d-flex align-items-center gap-1.5 text-secondary stat-subtext">
              <span className="text-secondary fw-semibold">Archived or inactive opportunities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid: Row 2 - Analytics Graphs */}
      <div className="row g-dashboard mb-4 position-relative" style={{ zIndex: 1 }}>
        {/* Pie Chart Widget */}
        <div className="col-12 col-lg-5">
          <div className="card glass-card border-0 h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h5 className="fw-bold mb-1" style={{ fontSize: '1.1rem' }}>Marketing Channels</h5>
                <p className="text-secondary small mb-0">Distribution of leads by incoming source.</p>
              </div>
            </div>
            
            <div style={{ height: '260px' }} className="d-flex align-items-center justify-content-center">
              {stats.total_leads > 0 ? (
                <Pie 
                  data={sourceChartData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: isDarkMode ? '#94a3b8' : '#64748b',
                          font: { family: 'Plus Jakarta Sans', weight: '600', size: 11 },
                          padding: 18,
                          usePointStyle: true,
                          pointStyle: 'circle'
                        }
                      },
                      tooltip: chartOptions.plugins.tooltip
                    }
                  }} 
                />
              ) : (
                <div className="text-center text-secondary py-5">
                  <i className="bi bi-funnel fs-2 mb-2 opacity-50"></i>
                  <p className="small">No lead source statistics available.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bar Chart Widget */}
        <div className="col-12 col-lg-7">
          <div className="card glass-card border-0 h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h5 className="fw-bold mb-1" style={{ fontSize: '1.1rem' }}>Lead Status Progression</h5>
                <p className="text-secondary small mb-0">Aggregate count of leads classified by funnel stage.</p>
              </div>
            </div>
            
            <div style={{ height: '260px' }}>
              {stats.total_leads > 0 ? (
                <Bar data={statusChartData} options={chartOptions} />
              ) : (
                <div className="text-center text-secondary py-5 d-flex flex-column align-items-center justify-content-center h-100">
                  <i className="bi bi-bar-chart-fill fs-2 mb-2 opacity-50"></i>
                  <p className="small">No status distribution statistics available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
