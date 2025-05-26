import React, { useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { scanAllProjects, fetchProjects } from '../features/projectSlice';

const ScanProjectsButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    try {
      setIsScanning(true);
      setError(null);
      setScanResult(null);
      
      const resultAction = await dispatch(scanAllProjects());
      
      if (scanAllProjects.fulfilled.match(resultAction)) {
        setScanResult(resultAction.payload);
        
        // Fetch the updated projects list
        await dispatch(fetchProjects());
      } else if (scanAllProjects.rejected.match(resultAction)) {
        setError(resultAction.payload as string || 'Failed to scan projects');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="mb-8">
      <button 
        onClick={handleScan}
        disabled={isScanning}
        className={`px-4 py-2 rounded-md ${isScanning 
          ? 'bg-gray-300 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        {isScanning ? 'Discovering Projects...' : 'Discover Projects'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {scanResult && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
          <p className="font-semibold">{scanResult.message}</p>
          <p className="mt-2">Scanned {scanResult.scannedProjects?.length || 0} projects</p>
          
          {scanResult.scannedProjects && scanResult.scannedProjects.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold">Results:</p>
              <ul className="mt-2 space-y-2">
                {scanResult.scannedProjects.map((project: any) => (
                  <li key={project.projectId} className="p-3 bg-white rounded shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{project.projectName}</span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {project.filesCount} files
                      </span>
                    </div>
                    {project.files && project.files.length > 0 && (
                      <div className="mt-2">
                        <details>
                          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                            Show files
                          </summary>
                          <ul className="mt-2 text-sm max-h-40 overflow-y-auto pl-4">
                            {project.files.map((file: any, index: number) => (
                              <li key={index} className="py-1">
                                <span className={file.created ? 'text-green-600' : 'text-amber-600'}>
                                  {file.created ? '[Added] ' : '[Updated] '}
                                </span>
                                {file.filePath}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScanProjectsButton;
