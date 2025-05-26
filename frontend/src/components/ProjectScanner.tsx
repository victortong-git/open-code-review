import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProjects } from '../features/projectSlice';
import ScanProjectsButton from './ScanProjectsButton';

const ProjectScanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const { projects, loading, error } = useAppSelector(state => state.projects);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Code Review Dashboard</h1>
        <ScanProjectsButton />
      </div>

      {loading && <div className="text-center p-4">Loading projects...</div>}
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6">
          <p className="font-semibold">Error loading projects:</p>
          <p>{error}</p>
        </div>
      )}

      {projects.length === 0 && !loading && !error && (
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <p className="text-gray-700 mb-4">No projects found.</p>
          <p className="text-gray-500">
            Click "Discover Projects" to scan for projects in the projects directory.
          </p>
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Projects ({projects.length})</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {projects.map(project => (
              <div 
                key={project.id} 
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-medium mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-600 mb-4">{project.description}</p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                  <span>
                    {project.stats ? (
                      <span className="flex space-x-2">
                        <span>{project.stats.totalFiles} files</span>
                        {project.stats.highRiskFindings > 0 && (
                          <span className="text-red-600">{project.stats.highRiskFindings} high risks</span>
                        )}
                      </span>
                    ) : 'No stats available'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectScanner;
