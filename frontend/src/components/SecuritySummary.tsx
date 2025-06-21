import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { ShieldCheckIcon, ShieldExclamationIcon, CodeBracketIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface SecuritySummaryProps {
  criticalRiskFindings: number;
  highRiskFindings: number;
  mediumRiskFindings: number;
  lowRiskFindings: number;
  totalFiles: number;
  discoveredFiles: number;
  ignoredFiles: number;
  refreshing: boolean;
  onRefresh: () => void;
}

const SecuritySummary: React.FC<SecuritySummaryProps> = ({
  criticalRiskFindings,
  highRiskFindings,
  mediumRiskFindings,
  lowRiskFindings,
  totalFiles,
  discoveredFiles,
  ignoredFiles,
  refreshing,
  onRefresh
}) => {
  const totalFindings = criticalRiskFindings + highRiskFindings + mediumRiskFindings + lowRiskFindings;
  
  // Data for the pie chart
  // Filter out zero values for better visualization
  let labels = [];
  let data = [];
  let backgroundColors = [];
  let borderColors = [];
  
  // Only include non-zero values in the chart
  if (criticalRiskFindings > 0) {
    labels.push('Critical Risk');
    data.push(criticalRiskFindings);
    backgroundColors.push('#dc2626');
    borderColors.push('#dc2626');
  }
  
  if (highRiskFindings > 0) {
    labels.push('High Risk');
    data.push(highRiskFindings);
    backgroundColors.push('#ef4444');
    borderColors.push('#ef4444');
  }
  
  if (mediumRiskFindings > 0) {
    labels.push('Medium Risk');
    data.push(mediumRiskFindings);
    backgroundColors.push('#f59e0b');
    borderColors.push('#f59e0b');
  }
  
  if (lowRiskFindings > 0) {
    labels.push('Low Risk');
    data.push(lowRiskFindings);
    backgroundColors.push('#10b981');
    borderColors.push('#10b981');
  }
  
  // If all values are zero, show empty state
  if (data.length === 0) {
    labels = ['No Findings'];
    data = [1];
    backgroundColors = ['#e5e7eb'];
    borderColors = ['#d1d5db'];
  }
  
  const findingsData = {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        hoverOffset: 10,
        hoverBorderWidth: 2,
      },
    ],
  };

  // Data for the bar chart
  const filesStatusData = {
    labels: ['Discovered', 'Not Discovered', 'Ignored'],
    datasets: [
      {
        label: 'Number of Files',
        data: [discoveredFiles, totalFiles - discoveredFiles - ignoredFiles, ignoredFiles],
        backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(156, 163, 175, 0.6)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(156, 163, 175)'],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Findings by Risk Level',
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
            const label = context.label || '';
            const value = context.raw || 0;
            
            // Handle the empty state
            if (label === 'No Findings') {
              return 'No security findings detected';
            }
            
            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: {
            size: 12
          }
        },
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.2)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 12
          }
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
        text: 'File Discovery Status',
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
          title: function(tooltipItems: any) {
            return tooltipItems[0].label;
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} files`;
          }
        }
      }
    },
  };

  // Calculate security score with all 4 levels properly weighted
  // Critical: 20, High: 10, Medium: 5, Low: 1
  const baseScore = totalFiles > 0 
    ? 100 - Math.min(100, ((criticalRiskFindings * 20 + highRiskFindings * 10 + mediumRiskFindings * 5 + lowRiskFindings * 1) / Math.max(totalFiles, 1)) * 3)
    : 100;
  
  const securityScore = Math.max(0, Math.round(baseScore));
  
  // Get color and text based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-600';
  };
  
  const getScoreText = (score: number) => {
    if (score >= 85) return { text: 'Good security practices detected', color: 'text-green-500' };
    if (score >= 70) return { text: 'Some security issues need attention', color: 'text-yellow-500' };
    if (score >= 50) return { text: 'Multiple security issues detected', color: 'text-orange-500' };
    return { text: 'Critical security issues detected', color: 'text-red-600' };
  };

  // Get percentage of files discovered
  const discoveredPercentage = totalFiles > 0 ? Math.round((discoveredFiles / totalFiles) * 100) : 0;

  const scoreTextInfo = getScoreText(securityScore);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Security Score Card */}
      <div className="card col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Security Score</h3>
          <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
        </div>
        <div className="flex flex-col items-center justify-center py-6">
          <div className={`text-6xl font-bold ${getScoreColor(securityScore)}`}>
            {securityScore}
          </div>
          <div className="mt-2 text-gray-500 dark:text-gray-400">out of 100</div>
          <div className="mt-4 text-sm text-center">
            <span className={scoreTextInfo.color}>{scoreTextInfo.text}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">CRITICAL</div>
            <div className="text-xl font-semibold text-red-700">{criticalRiskFindings}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">HIGH</div>
            <div className="text-xl font-semibold text-red-500">{highRiskFindings}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">MEDIUM</div>
            <div className="text-xl font-semibold text-yellow-500">{mediumRiskFindings}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">LOW</div>
            <div className="text-xl font-semibold text-green-500">{lowRiskFindings}</div>
          </div>
        </div>
      </div>

      {/* Findings Chart */}
      <div className="card col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Findings Distribution</h3>
          <div className="flex items-center">
            <ShieldExclamationIcon className="h-6 w-6 text-blue-500 mr-2" />
            <button 
              onClick={onRefresh} 
              disabled={refreshing}
              className="btn btn-secondary btn-sm flex items-center"
            >
              {refreshing ? (
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
          </div>
        </div>
        {totalFindings > 0 ? (
          <div className="h-72 flex-1 relative chart-container">
            <Pie data={findingsData} options={pieOptions} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-3xl font-bold">{totalFindings}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-72 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <ExclamationCircleIcon className="h-12 w-12 mb-2 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">No security findings detected</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Run a security scan to detect vulnerabilities</p>
          </div>
        )}
      </div>

      {/* Files Chart */}
      <div className="card col-span-1 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Code Discovery Status</h3>
          <CodeBracketIcon className="h-6 w-6 text-blue-500" />
        </div>
        <div className="h-72 flex-1 relative chart-container">
          <Bar data={filesStatusData} options={barOptions} />
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="card col-span-1 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">TOTAL FINDINGS</div>
            <div className="text-2xl font-bold">{totalFindings}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">FILES DISCOVERED</div>
            <div className="text-2xl font-bold">{discoveredPercentage}%</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">AVG ISSUES PER FILE</div>
            <div className="text-2xl font-bold">
              {discoveredFiles > 0 ? (totalFindings / discoveredFiles).toFixed(1) : '0.0'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">CRITICAL RATIO</div>
            <div className="text-2xl font-bold">
              {totalFindings > 0 ? `${Math.round(((criticalRiskFindings + highRiskFindings) / totalFindings) * 100)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySummary;
