import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  // XCircleIcon, // Removed unused import
  ShieldExclamationIcon,
  ChartBarIcon,
  CodeBracketIcon,
  FolderIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import type { AppDispatch, RootState } from '../store/store';
import { fetchProjects, scanAllProjects, getProjectStats } from '../features/projectSlice';
import { fetchFindings } from '../features/findingSlice';
import { fetchFiles } from '../features/fileSlice'; // Import fetchFiles
import type { Project } from '../features/projectSlice';
// import type { Finding } from '../features/findingSlice'; // Removed unused import
// import type { File } from '../features/fileSlice'; // Removed unused import
import DashboardCard from '../components/DashboardCard';
// Ensure no other imports from fileSlice are present that are not exported
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { useToast } from '../context/ToastContext';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const GlobalDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, loading, error } = useSelector((state: RootState) => state.projects);
  const { findings } = useSelector((state: RootState) => state.findings);
  const { files } = useSelector((state: RootState) => state.files); // Access files from store
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { showToast } = useToast();
  const [allProjectStatsFetched, setAllProjectStatsFetched] = useState(false); // New state variable
  const [statsLoadingTimedOut, setStatsLoadingTimedOut] = useState(false); // Add timeout state

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchFindings()); // Fetch all findings on mount
    dispatch(fetchFiles()); // Fetch all files on mount
  }, [dispatch]);

  useEffect(() => {
    // Get stats for each project to ensure real data is loaded
    const fetchStatsForProjectsWithoutStats = async () => {
      // If no projects exist, mark stats as fetched to avoid infinite loading
      if (projects.length === 0) {
        setAllProjectStatsFetched(true);
        return;
      }

      const projectsWithoutStats = projects.filter(project => project.id && !project.stats);
      if (projectsWithoutStats.length > 0) {
        try {
          await Promise.all(
            projectsWithoutStats.map(project =>
              project.id ? dispatch(getProjectStats(project.id)).unwrap() : Promise.resolve()
            )
          );
        } catch (error) {
          console.error('Error fetching project stats:', error);
          // Continue anyway to prevent blocking the UI
        }
      }
      
      // Mark stats as fetched even if some failed, to prevent infinite loading
      setAllProjectStatsFetched(true);
    };
    
    fetchStatsForProjectsWithoutStats();
    
    // Set a timeout to prevent infinite loading if fetching stats takes too long
    const timeoutId = setTimeout(() => {
      setStatsLoadingTimedOut(true);
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, [dispatch, projects]); // Depend on projects array

  const handleRefresh = async () => {
    setRefreshing(true);
    setAllProjectStatsFetched(false); // Reset on refresh
    await dispatch(fetchProjects());
    await dispatch(fetchFindings()); // Fetch all findings on refresh
    await dispatch(fetchFiles()); // Fetch all files on refresh
    
    setTimeout(() => setRefreshing(false), 500); // Add small delay for better UX
  };
  
  const handleScanAll = async () => {
    setScanning(true);
    setAllProjectStatsFetched(false); // Reset on scan all
    showToast('Starting discovery for all projects...', 'info');
    
    try {
      await dispatch(scanAllProjects()).unwrap();
      showToast('All projects scanned successfully', 'success');
      
      // Refresh projects, findings, and files to get updated data
      await dispatch(fetchProjects()).unwrap();
      await dispatch(fetchFindings()).unwrap(); // Fetch all findings after scan
      await dispatch(fetchFiles()).unwrap(); // Fetch all files after scan
      
      // Get stats for each project to update the dashboard
      // This will be handled by the useEffect that watches the projects array
      
      showToast('Dashboard data updated', 'success');
    } catch (error: any) {
      showToast(`Failed to discover projects: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setScanning(false);
    }
  };

  // Calculate global stats from all projects, files, and findings
  const calculateGlobalStats = () => {
    const stats = {
      totalProjects: projects.length,
      totalFiles: files.length, // Use files.length for total files
      scannedFiles: files.filter(file => file.scanned).length, // Count scanned files from files data
      ignoredFiles: files.filter(file => file.is_ignored).length, // Count ignored files from files data
      criticalRiskFindings: 0,
      highRiskFindings: 0,
      mediumRiskFindings: 0,
      lowRiskFindings: 0,
      projectsWithHighRisk: 0
    };

    // Count findings by severity from actual findings data
    findings.forEach(finding => {
      if (finding.severity === 'critical') {
        stats.criticalRiskFindings++;
      } else if (finding.severity === 'high') {
        stats.highRiskFindings++;
      } else if (finding.severity === 'medium') {
        stats.mediumRiskFindings++;
      } else if (finding.severity === 'low') {
        stats.lowRiskFindings++;
      }
    });

    // Calculate projects with high risk
    const projectsWithHighRiskFindings = new Set<number>();
    findings.forEach(finding => {
      if ((finding.severity === 'high' || finding.severity === 'critical') && finding.file_id) {
        // Find the file using file_id from the files array
        const file = files.find(f => f.id === finding.file_id);
        if (file && file.project_id) {
          projectsWithHighRiskFindings.add(file.project_id);
        }
      }
    });
    
    stats.projectsWithHighRisk = projectsWithHighRiskFindings.size;

    return stats;
  };

  const globalStats = calculateGlobalStats();
  const totalFindings = globalStats.criticalRiskFindings + globalStats.highRiskFindings + globalStats.mediumRiskFindings + globalStats.lowRiskFindings;

  // Get highest risk project
  const getHighestRiskProject = (): Project | null => {
    if (projects.length === 0) return null;
    
    return projects.reduce((highest, current) => {
      const highestCritical = highest.stats?.criticalRiskFindings || 0;
      const currentCritical = current.stats?.criticalRiskFindings || 0;
      const highestHigh = highest.stats?.highRiskFindings || 0;
      const currentHigh = current.stats?.highRiskFindings || 0;

      if (currentCritical > highestCritical) {
        return current;
      } else if (currentCritical === highestCritical && currentHigh > highestHigh) {
        return current;
      }
      return highest;
    }, projects[0]);
  };

  const highestRiskProject = getHighestRiskProject();

  // Security findings chart data
  const securityChartData = {
    labels: ['Critical Risk', 'High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [
      {
        data: [globalStats.criticalRiskFindings, globalStats.highRiskFindings, globalStats.mediumRiskFindings, globalStats.lowRiskFindings],
        backgroundColor: ['rgba(220, 38, 38, 0.8)', 'rgba(239, 68, 68, 0.75)', 'rgba(245, 158, 11, 0.7)', 'rgba(59, 130, 246, 0.7)'],
        borderColor: ['rgb(185, 28, 28)', 'rgb(220, 38, 38)', 'rgb(217, 119, 6)', 'rgb(37, 99, 235)'],
        borderWidth: 1,
      },
    ],
  };

  // Files status chart data
  const filesChartData = {
    labels: ['Scanned', 'Not Scanned', 'Ignored'],
    datasets: [
      {
        data: [
          globalStats.scannedFiles, 
          globalStats.totalFiles - globalStats.scannedFiles - globalStats.ignoredFiles, 
          globalStats.ignoredFiles
        ],
        backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(156, 163, 175, 0.6)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(156, 163, 175)'],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
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
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  // Calculate scan completion percentage
  const scanCompletion = globalStats.totalFiles > 0
    ? Math.round((globalStats.scannedFiles / globalStats.totalFiles) * 100)
    : 0;

  // Conditionally render content based on loading and allProjectStatsFetched
  if (loading || (!allProjectStatsFetched && !statsLoadingTimedOut)) {
     return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Global Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of all projects and security findings</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handleScanAll}
              disabled={scanning || refreshing}
              className="btn btn-primary flex items-center"
            >
              {scanning ? (
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
              )}
              Discover All
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing || scanning}
              className="btn btn-secondary flex items-center"
            >
              {refreshing ? (
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Projects"
          value={globalStats.totalProjects}
          icon={<FolderIcon className="h-full w-full" />}
          color="border-blue-500"
        />
        <DashboardCard
          title="Total Files"
          value={globalStats.totalFiles}
          icon={<DocumentTextIcon className="h-full w-full" />}
          color="border-green-500"
        />
        <DashboardCard
          title="Code Scan Completion"
          value={`${scanCompletion}%`}
          icon={<CheckCircleIcon className="h-full w-full" />}
          color="border-blue-500"
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Security findings chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Security Findings</h3>
            <ExclamationCircleIcon className="h-6 w-6 text-blue-500" />
          </div>
          <div className="h-64 relative">
            {totalFindings > 0 ? (
              <Bar data={securityChartData} options={chartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <ShieldExclamationIcon className="h-12 w-12 mb-2" />
                <p>No findings detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Files status chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Files Status</h3>
            <CodeBracketIcon className="h-6 w-6 text-blue-500" />
          </div>
          <div className="h-64 relative">
            {globalStats.totalFiles > 0 ? (
              <Pie data={filesChartData} options={chartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <DocumentTextIcon className="h-12 w-12 mb-2" />
                <p>No files discovered yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key insights section */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Key Insights</h3>
          <ChartBarIcon className="h-6 w-6 text-blue-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">PROJECTS WITH HIGH RISK FINDINGS</div>
            <div className="text-2xl font-bold">
              {globalStats.projectsWithHighRisk} / {globalStats.totalProjects}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">HIGHEST RISK PROJECT</div>
            <div className="text-2xl font-bold text-red-500">
              {highestRiskProject ? (
                <Link to={`/dashboard/${highestRiskProject.id}`} className="hover:underline">
                  {highestRiskProject.name}
                </Link>
              ) : 'None'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">AVG. ISSUES PER PROJECT</div>
            <div className="text-2xl font-bold">
              {globalStats.totalProjects > 0 ? (totalFindings / globalStats.totalProjects).toFixed(1) : '0.0'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">CRITICAL FINDINGS RATIO</div>
            <div className="text-2xl font-bold">
              {totalFindings > 0 ? `${Math.round((globalStats.criticalRiskFindings / totalFindings) * 100)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalDashboard;
