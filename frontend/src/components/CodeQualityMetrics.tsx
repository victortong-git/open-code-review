import React from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { CodeBracketSquareIcon } from '@heroicons/react/24/outline';

// Register ChartJS components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const CodeQualityMetrics: React.FC = () => {
  // In a real application, you would fetch this data from an API
  // For now, we'll use mock data
  
  const data = {
    labels: ['Code Coverage', 'Maintainability', 'Security', 'Performance', 'Reliability', 'Code Duplication'],
    datasets: [
      {
        label: 'Current Project',
        data: [75, 80, 65, 85, 70, 60],
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Best Practice',
        data: [90, 85, 90, 90, 85, 80],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          callback: function(value: any) {
            return value + '%';
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
        text: 'Code Quality Metrics',
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
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      }
    },
  };

  // Calculate the average code quality score
  const currentValues = data.datasets[0].data;
  const averageScore = Math.round(currentValues.reduce((a, b) => a + b, 0) / currentValues.length);
  
  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="card col-span-1 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Code Quality Analysis</h3>
        <CodeBracketSquareIcon className="h-6 w-6 text-blue-500" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <div className="md:col-span-1 flex flex-col items-center justify-center">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">OVERALL QUALITY</div>
          <div className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>
            {averageScore}%
          </div>
          <div className="mt-2 text-sm text-center">
            {averageScore >= 80 ? (
              <span className="text-green-500">Great code quality</span>
            ) : averageScore >= 60 ? (
              <span className="text-yellow-500">Needs improvement</span>
            ) : (
              <span className="text-red-500">Critical issues</span>
            )}
          </div>
        </div>
        
        <div className="md:col-span-4 h-72">
          <Radar data={data} options={options} />
        </div>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-sm">
        {data.labels.map((label, index) => (
          <div key={label} className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">{label.toUpperCase()}</div>
            <div className={`font-semibold ${getScoreColor(data.datasets[0].data[index])}`}>
              {data.datasets[0].data[index]}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeQualityMetrics;
