import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProjectList from './pages/ProjectList';
import Dashboard from './pages/Dashboard';
import GlobalDashboard from './pages/GlobalDashboard';
import FileScan from './pages/FileScan';
import FileDetail from './pages/FileDetail';
import FindingCreate from './pages/FindingCreate';
import FindingDetail from './pages/FindingDetail';
import EditFinding from './pages/EditFinding'; // Add missing import
import StaticPage from './pages/StaticPage';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';

// Force CSS refresh on page load
if (import.meta.env.DEV) {
  // This will force a CSS refresh in development mode
  const styleElement = document.createElement('style');
  styleElement.textContent = ' ';
  document.head.appendChild(styleElement);
}

function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <ThemeProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
              <Navbar />
              <main className="flex-grow pb-6">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<ProjectList />} />
                    <Route path="/dashboard" element={<GlobalDashboard />} />
                    <Route path="/dashboard/:projectId" element={<Dashboard />} />
                    <Route path="/scan/:fileId" element={<FileScan />} />
                    <Route path="/files/:fileId" element={<FileDetail />} />
                    <Route path="/findings/new" element={<FindingCreate />} />
                    <Route path="/findings/:id" element={<FindingDetail />} />
                    <Route path="/findings/:id/edit" element={<EditFinding />} />
                    <Route path="/static/:pageName" element={<StaticPage />} />
                  </Routes>
                </ErrorBoundary>
              </main>
              <Footer />
            </div>
          </Router>
        </ThemeProvider>
      </ToastProvider>
    </Provider>
  );
}

export default App
