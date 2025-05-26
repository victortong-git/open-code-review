import React from 'react';
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

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FindingsDistribution: React.FC = () => {
  // In a real application, you would fetch this data from an API
  // For now, we'll use mock data for demonstration purposes
  
  const data = {
    labels: [
      'SQL Injection', 
      'XSS', 
      'CSRF', 
      'Insecure Auth', 
      'Sensitive Data Exposure',
      'Access Control',
      'Security Misconfiguration',
      'Outdated Components'
    ],
    datasets: [
      {
        label: 'High Risk',
        data: [3, 2, 0, 1, 2, 1, 0, 2],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
      {
        label: 'Medium Risk',
        data: [1, 3, 2, 2, 1, 3, 2, 1],
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
      },
      {
        label: 'Low Risk',
        data: [0, 1, 3, 2, 1, 2, 4, 3],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
    ],
  };

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
    const totals = data.labels.map((_, index) => {
      return data.datasets.reduce((sum, dataset) => sum + dataset.data[index], 0);
    });
    
    // Get the category with max findings
    const maxValue = Math.max(...totals);
    const maxIndex = totals.indexOf(maxValue);
    
    return {
      totals,
      maxCategory: data.labels[maxIndex],
      maxValue
    };
  };

  const { totals, maxCategory, maxValue } = calculateTotals();

  return (
    <div className="card col-span-1 lg:col-span-2">
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
      
      <div className="h-72">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default FindingsDistribution;
