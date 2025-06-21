import React from 'react';
import { useSelector } from 'react-redux';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TableCellsIcon } from '@heroicons/react/24/outline';
import type { RootState } from '../store/store';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FindingsDistribution: React.FC = () => {
  // Get findings from Redux store
  const { findings } = useSelector((state: RootState) => state.analysis);
  
  // Process findings data to group by type and severity
  const processFindings = () => {
    if (!findings || findings.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Group findings by type
    const findingsByType: Record<string, { critical: number; high: number; medium: number; low: number }> = {};
    
    findings.forEach((finding: any) => {
      const type = finding.type || 'Unknown';
      if (!findingsByType[type]) {
        findingsByType[type] = { critical: 0, high: 0, medium: 0, low: 0 };
      }
      // Backend uses string severity, make sure it matches our expected values
      const severity = finding.severity?.toLowerCase();
      if (severity && ['critical', 'high', 'medium', 'low'].includes(severity)) {
        findingsByType[type][severity as 'critical' | 'high' | 'medium' | 'low'] += 1;
      }
    });

    // Convert to chart format
    const labels = Object.keys(findingsByType);
    const criticalData = labels.map(label => findingsByType[label].critical);
    const highData = labels.map(label => findingsByType[label].high);
    const mediumData = labels.map(label => findingsByType[label].medium);
    const lowData = labels.map(label => findingsByType[label].low);

    return {
      labels,
      datasets: [
        {
          label: 'Critical Risk',
          data: criticalData,
          backgroundColor: 'rgba(220, 38, 38, 0.8)', // Darker red
        },
        {
          label: 'High Risk',
          data: highData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
        },
        {
          label: 'Medium Risk',
          data: mediumData,
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
        },
        {
          label: 'Low Risk',
          data: lowData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        },
      ],
    };
  };

  const data = processFindings();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: {
          font: {
            size: 10
          },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Findings by Category',
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
            return `${label}: ${value}`;
          }
        }
      }
    },
  };

  // Extract total findings per category
  const calculateTotals = () => {
    if (!data.labels || data.labels.length === 0) {
      return {
        totals: [],
        maxCategory: 'No data',
        maxValue: 0
      };
    }

    const totals = data.labels.map((_, index) => {
      return data.datasets.reduce((sum, dataset) => sum + (dataset.data[index] || 0), 0);
    });
    
    // Get the category with max findings
    const maxValue = Math.max(...totals);
    const maxIndex = totals.indexOf(maxValue);
    
    return {
      totals,
      maxCategory: data.labels[maxIndex] || 'No data',
      maxValue
    };
  };

  const { totals, maxCategory, maxValue } = calculateTotals();

  // Show message when no data is available
  if (!findings || findings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Findings Distribution</h3>
          <TableCellsIcon className="h-6 w-6 text-blue-500" />
        </div>
        
        <div className="text-center py-12">
          <TableCellsIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Findings Data</h4>
          <p className="text-gray-500 dark:text-gray-400">
            No security findings are available for this project yet. 
            Run a security analysis to see findings distribution by category.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Findings Distribution</h3>
        <TableCellsIcon className="h-6 w-6 text-blue-500" />
      </div>
      
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Insights</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Most frequent issue: <span className="font-semibold text-red-500">{maxCategory}</span> with {maxValue} total findings
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Top 3 categories account for {totals.sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0)} findings
        </p>
      </div>
      
      <div className="h-72 chart-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default FindingsDistribution;
