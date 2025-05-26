import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 shadow-inner py-3 mt-auto sticky bottom-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Powered by{' '}
              <a
                href="https://docs.NVIDIA.com/agentiq/latest/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                NVIDIA AgentIQ Toolkit
              </a>
            </span>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/victortong-git/open-code-review"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline flex items-center"
              >
                <span>GitHub</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-4 h-4 ml-1"
                >
                  <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56v-2.02c-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.75-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.3 1.2-3.11-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.19a11.1 11.1 0 015.8 0c2.2-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.05.75.81 1.2 1.85 1.2 3.11 0 4.43-2.69 5.41-5.25 5.7.42.36.8 1.08.8 2.18v3.24c0 .31.21.67.8.56A10.5 10.5 0 0023.5 12C23.5 5.73 18.27.5 12 .5z" />
                </svg>
                <span className="ml-2">Version: 0.1 (POC Build for NVIDIA Hackathon)</span>
              </a>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <Link to="/static/about" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
              About
            </Link>
            <Link to="/static/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
              Terms
            </Link>
            <Link to="/static/license" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
              License
            </Link>
            <Link to="/static/help" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
              Help
            </Link>
            <a
              href="https://www.linkedin.com/in/vsctong"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 dark:text-gray-400 hover:underline flex items-center"
            >
              <span>Developed by Victor Tong</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="#0077B5" /* LinkedIn blue color */
                className="w-4 h-4 ml-1"
              >
                <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 00.1.42V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
