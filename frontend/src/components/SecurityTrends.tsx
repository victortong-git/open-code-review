import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChartBarSquareIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface TrendDataPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface SecurityTrendsProps {
  projectId: number;
}

const SecurityTrends: React.FC<SecurityTrendsProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  
  useEffect(() => {
    const fetchTrendData = async () => {
      if (!projectId) return;
      
      setLoading(true);
      setError(null);
      try {
        // Import API from services to use the configured baseURL
        const api = (await import('../services/api')).default;
        
        // Fetch trend data from API using the configured baseURL
        const response = await api.get(`/projects/${projectId}/findings/trends`);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setTrendData(response.data);
        } else {
          setTrendData([]);
          setError("No trend data available");
        }
      } catch (error) {
        console.error('Failed to fetch security trends:', error);
        // Provide more detailed error message if available
        if (axios.isAxiosError(error)) {
          if (error.code === 'ERR_NETWORK') {
            setError("Network error - Please check your connection or if the backend service is running");
          } else {
            setError(`Failed to fetch security trend data: ${error.response?.status || ''} ${error.message}`);
          }
        } else {
          setError("Failed to fetch security trend data");
        }
        setTrendData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendData();
  }, [projectId]);
  
  if (loading) {
    return (
      <div className="card col-span-1 lg:col-span-2 flex justify-center items-center h-72 mt-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || trendData.length === 0) {
    return (
      <div className="card col-span-1 lg:col-span-2 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Security Trends</h3>
          <ChartBarSquareIcon className="h-6 w-6 text-blue-500" />
        </div>
        <div className="h-72 flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-center p-6">
            <ExclamationCircleIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-1">No Trend Data Available</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {error || "There is no historical security trend data available for this project."}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Extract dates and values from the trend data
  const dates = trendData.map(item => item.date);
  const criticalValues = trendData.map(item => item.critical);
  const highValues = trendData.map(item => item.high);
  const mediumValues = trendData.map(item => item.medium);
  const lowValues = trendData.map(item => item.low);
  
  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Critical Risk',
        data: criticalValues,
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        tension: 0.3,
      },
      {
        label: 'High Risk',
        data: highValues,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Medium Risk',
        data: mediumValues,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Low Risk',
        data: lowValues,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Findings',
          font: {
            size: 12
          }
        },
        ticks: {
          precision: 0
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Security Findings Trend',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} findings`;
          }
        }
      }
    },
  };

  return (
    <div className="card col-span-1 lg:col-span-2 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Security Trends</h3>
        <ChartBarSquareIcon className="h-6 w-6 text-blue-500" />
      </div>
      <div className="h-72 flex-1 relative">
        <Line data={data} options={options} />
      </div>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        <p>This chart shows the trend of security findings over time</p>
      </div>
    </div>
  );
};

export default SecurityTrends;
