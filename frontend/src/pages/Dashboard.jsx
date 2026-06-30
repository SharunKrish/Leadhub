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
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-secondary">Loading analytics dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4 d-flex align-items-center gap-2" role="alert">
        <i className="bi bi-exclamation-octagon-fill fs-4"></i>
        <div>
          <h5 className="alert-heading fw-bold mb-1">Server Error</h5>
          <p className="mb-0">{error}</p>
          <button onClick={fetchStats} className="btn btn-outline-danger btn-sm mt-3">
            <i className="bi bi-arrow-clockwise me-1"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  const sourceLabels = {
    facebook: 'Facebook',
    google: 'Google',
    organic: 'Organic'
  };

  const statusLabels = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    closed: 'Closed'
  };

  // Pie Chart Data: Lead Source
  const sourceChartData = {
    labels: Object.keys(stats.source_distribution).map(k => sourceLabels[k] || k),
    datasets: [
      {
        data: Object.values(stats.source_distribution),
        backgroundColor: [
          'rgba(24, 119, 242, 0.75)',  // Facebook Blue
          'rgba(234, 67, 53, 0.75)',   // Google Red
          'rgba(52, 168, 83, 0.75)',   // Organic Green
        ],
        borderColor: isDarkMode ? '#1e293b' : '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // Bar Chart Data: Lead Status
  const statusChartData = {
    labels: Object.keys(stats.status_summary).map(k => statusLabels[k] || k),
    datasets: [
      {
        label: 'Leads Count',
        data: Object.values(stats.status_summary),
        backgroundColor: [
          'rgba(13, 110, 253, 0.75)',  // New (Blue)
          'rgba(255, 193, 7, 0.75)',   // Contacted (Yellow)
          'rgba(25, 135, 84, 0.75)',   // Qualified (Green)
          'rgba(220, 53, 69, 0.75)',   // Closed (Red)
        ],
        borderColor: isDarkMode ? '#1e293b' : '#ffffff',
        borderWidth: 1,
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
          color: isDarkMode ? '#f8f9fa' : '#212529',
          font: {
            family: 'Plus Jakarta Sans',
            weight: '500'
          }
        }
      }
    },
    scales: {
      y: {
        ticks: { color: isDarkMode ? '#f8f9fa' : '#212529' },
        grid: { color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
      },
      x: {
        ticks: { color: isDarkMode ? '#f8f9fa' : '#212529' },
        grid: { display: false }
      }
    }
  };

  return (
    <div className="container-fluid py-4 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Overview Dashboard</h2>
          <p className="text-secondary small">Real-time statistics & marketing channel distribution</p>
        </div>
        <button onClick={fetchStats} className="btn btn-outline-primary btn-sm rounded-3">
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card glass-card p-4 h-100 border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-secondary small fw-semibold">Total Leads</span>
                <h2 className="fw-extrabold mt-2 mb-0 display-6">{stats.total_leads}</h2>
              </div>
              <div className="stat-icon-wrapper bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-people-fill fs-4"></i>
              </div>
            </div>
            <div className="mt-3 text-success small">
              <i className="bi bi-arrow-up-right me-1"></i>
              <span>All-time conversion ready</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card glass-card p-4 h-100 border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-secondary small fw-semibold">Today's Leads</span>
                <h2 className="fw-extrabold mt-2 mb-0 display-6">{stats.today_leads}</h2>
              </div>
              <div className="stat-icon-wrapper bg-info bg-opacity-10 text-info">
                <i className="bi bi-calendar-event fs-4"></i>
              </div>
            </div>
            <div className="mt-3 text-info small">
              <i className="bi bi-circle-fill me-1 small"></i>
              <span>Updates every hour</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card glass-card p-4 h-100 border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-secondary small fw-semibold">Qualified Leads</span>
                <h2 className="fw-extrabold mt-2 mb-0 display-6">
                  {stats.status_summary.qualified}
                </h2>
              </div>
              <div className="stat-icon-wrapper bg-success bg-opacity-10 text-success">
                <i className="bi bi-patch-check-fill fs-4"></i>
              </div>
            </div>
            <div className="mt-3 text-success small">
              <i className="bi bi-activity me-1"></i>
              <span>
                {stats.total_leads > 0 
                  ? ((stats.status_summary.qualified / stats.total_leads) * 100).toFixed(1)
                  : 0}% conversion rate
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card glass-card p-4 h-100 border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-secondary small fw-semibold">Closed Opportunities</span>
                <h2 className="fw-extrabold mt-2 mb-0 display-6">
                  {stats.status_summary.closed}
                </h2>
              </div>
              <div className="stat-icon-wrapper bg-danger bg-opacity-10 text-danger">
                <i className="bi bi-x-circle-fill fs-4"></i>
              </div>
            </div>
            <div className="mt-3 text-secondary small">
              <i className="bi bi-archive me-1"></i>
              <span>Archived or inactive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Graphs */}
      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card glass-card p-4 border-0 h-100">
            <h5 className="fw-bold mb-4">Leads by Source</h5>
            <div style={{ height: '300px' }} className="d-flex align-items-center justify-content-center">
              {stats.total_leads > 0 ? (
                <Pie data={sourceChartData} options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: isDarkMode ? '#f8f9fa' : '#212529',
                        font: {
                          family: 'Plus Jakarta Sans',
                          weight: '500'
                        }
                      }
                    }
                  }
                }} />
              ) : (
                <p className="text-secondary">No lead data to display source distribution.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card glass-card p-4 border-0 h-100">
            <h5 className="fw-bold mb-4">Leads Status Summary</h5>
            <div style={{ height: '300px' }}>
              {stats.total_leads > 0 ? (
                <Bar data={statusChartData} options={chartOptions} />
              ) : (
                <p className="text-secondary text-center py-5">No status data to display.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
