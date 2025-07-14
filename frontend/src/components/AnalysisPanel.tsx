import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { getAnalysisStatus, getAnalysisResults, triggerComprehensiveReview, triggerSelectiveReview } from '../features/analysisSlice';
import { markFileProcessed } from '../features/fileSlice';
import { ShieldCheckIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import websocketService from '../services/websocket';

interface AnalysisPanelProps {
  fileId: number;
}

interface ReviewProgress {
  reviewType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

const OWASP_CATEGORIES = [
  { 
    id: 'general_review', 
    name: 'General Code Review',
    description: 'Overall code quality, performance, and best practices review'
  },
  { 
    id: 'owasp_2021_a01', 
    name: 'A01: Broken Access Control',
    description: 'Missing access controls, privilege escalation, forced browsing'
  },
  { 
    id: 'owasp_2021_a02', 
    name: 'A02: Cryptographic Failures',
    description: 'Weak encryption, exposed sensitive data, poor key management'
  },
  { 
    id: 'owasp_2021_a03', 
    name: 'A03: Injection',
    description: 'SQL injection, NoSQL injection, command injection, LDAP injection'
  },
  { 
    id: 'owasp_2021_a04', 
    name: 'A04: Insecure Design',
    description: 'Missing or ineffective security controls in design and architecture'
  },
  { 
    id: 'owasp_2021_a05', 
    name: 'A05: Security Misconfiguration',
    description: 'Insecure default configurations, cloud misconfigurations'
  },
  { 
    id: 'owasp_2021_a06', 
    name: 'A06: Vulnerable Components',
    description: 'Outdated or vulnerable libraries and frameworks'
  },
  { 
    id: 'owasp_2021_a07', 
    name: 'A07: Auth & Identification Failures',
    description: 'Weak authentication, session management flaws, credential stuffing'
  },
  { 
    id: 'owasp_2021_a08', 
    name: 'A08: Software/Data Integrity Failures',
    description: 'Insecure CI/CD pipelines, auto-update vulnerabilities'
  },
  { 
    id: 'owasp_2021_a09', 
    name: 'A09: Security Logging Failures',
    description: 'Insufficient logging, monitoring, and incident response'
  },
  { 
    id: 'owasp_2021_a10', 
    name: 'A10: Server-Side Request Forgery',
    description: 'SSRF attacks allowing access to internal resources'
  },
];

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ fileId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComprehensiveReview, setIsComprehensiveReview] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<number | null>(null);
  const [currentReview, setCurrentReview] = useState<string>('');
  const [reviewProgress, setReviewProgress] = useState<ReviewProgress[]>(
    OWASP_CATEGORIES.map(cat => ({
      reviewType: cat.id,
      status: 'pending'
    }))
  );
  const [hasAnalysisCompleted, setHasAnalysisCompleted] = useState(false);
  
  // Selective review state
  const [showSelectiveOptions, setShowSelectiveOptions] = useState(false);
  const [selectedReviewTypes, setSelectedReviewTypes] = useState<string[]>([]);
  const [isSelectiveReview, setIsSelectiveReview] = useState(false);
  
  // Get analysis status from Redux store
  const analysisStatus = useSelector((state: RootState) => 
    state.analysis.analysisStatus[fileId] || { status: 'pending', progress: 0 }
  );
  
  // Start polling for analysis status
  const startStatusPolling = (jobId: string) => {
    // Clear any existing polling
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }
    
    // Start new polling every 5 seconds
    const intervalId = window.setInterval(() => {
      dispatch(getAnalysisStatus(jobId));
    }, 5000);
    
    setPollingIntervalId(intervalId);
  };
  
  // Stop polling
  const stopStatusPolling = () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
  };
  
  // Handle selective review type changes
  const handleReviewTypeToggle = (reviewType: string) => {
    setSelectedReviewTypes(prev => {
      if (prev.includes(reviewType)) {
        return prev.filter(type => type !== reviewType);
      } else {
        return [...prev, reviewType];
      }
    });
  };

  // Preset selections
  const handleSelectAll = () => {
    setSelectedReviewTypes(OWASP_CATEGORIES.map(cat => cat.id));
  };

  const handleSelectNone = () => {
    setSelectedReviewTypes([]);
  };

  const handleSelectSecurityOnly = () => {
    setSelectedReviewTypes(OWASP_CATEGORIES.filter(cat => cat.id !== 'general_review').map(cat => cat.id));
  };

  const handleSelectGeneralOnly = () => {
    setSelectedReviewTypes(['general_review']);
  };

  // Start comprehensive review (all OWASP categories)
  const handleStartComprehensiveReview = async () => {
    setIsAnalyzing(true);
    setIsComprehensiveReview(true);
    setIsSelectiveReview(false);
    setAnalysisError(null);
    setCurrentReview('general_review');
    setReviewProgress(OWASP_CATEGORIES.map(cat => ({
      reviewType: cat.id,
      status: 'pending'
    })));
    setHasAnalysisCompleted(false);
    
    try {
      const resultAction = await dispatch(triggerComprehensiveReview(fileId));
      
      if (triggerComprehensiveReview.fulfilled.match(resultAction)) {
        // If we got a successful response with a jobId, start polling for status updates
        const { jobId, status } = resultAction.payload;
        
        if (jobId && status !== 'completed' && status !== 'failed') {
          // Subscribe to websocket updates
          websocketService.subscribeToJob(jobId);
          
          // Also start polling as a fallback
          startStatusPolling(jobId);
        }
      } else if (triggerComprehensiveReview.rejected.match(resultAction)) {
        // Handle the error case
        const payload = resultAction.payload as any;
        const errorMessage = payload?.message || 'Failed to start comprehensive review';
        setAnalysisError(errorMessage);
      }
    } catch (error) {
      setAnalysisError('Unexpected error occurred during comprehensive review');
    } finally {
      // Show the loading state for at least 2 seconds
      setTimeout(() => {
        if (!analysisStatus.status || analysisStatus.status === 'failed') {
          setIsAnalyzing(false);
        }
      }, 2000);
    }
  };

  // Start selective review (user-chosen categories)
  const handleStartSelectiveReview = async () => {
    if (selectedReviewTypes.length === 0) {
      setAnalysisError('Please select at least one review type');
      return;
    }

    setIsAnalyzing(true);
    setIsComprehensiveReview(false);
    setIsSelectiveReview(true);
    setAnalysisError(null);
    setCurrentReview(selectedReviewTypes[0]);
    setReviewProgress(selectedReviewTypes.map(reviewType => ({
      reviewType,
      status: 'pending'
    })));
    setHasAnalysisCompleted(false);
    
    try {
      const resultAction = await dispatch(triggerSelectiveReview({ 
        fileId, 
        reviewTypes: selectedReviewTypes 
      }));
      
      if (triggerSelectiveReview.fulfilled.match(resultAction)) {
        // If we got a successful response with a jobId, start polling for status updates
        const { jobId, status } = resultAction.payload;
        
        if (jobId && status !== 'completed' && status !== 'failed') {
          // Subscribe to websocket updates
          websocketService.subscribeToJob(jobId);
          
          // Also start polling as a fallback
          startStatusPolling(jobId);
        }
      } else if (triggerSelectiveReview.rejected.match(resultAction)) {
        // Handle the error case
        const payload = resultAction.payload as any;
        const errorMessage = payload?.message || 'Failed to start selective review';
        setAnalysisError(errorMessage);
      }
    } catch (error) {
      setAnalysisError('Unexpected error occurred during selective review');
    } finally {
      // Show the loading state for at least 2 seconds
      setTimeout(() => {
        if (!analysisStatus.status || analysisStatus.status === 'failed') {
          setIsAnalyzing(false);
        }
      }, 2000);
    }
  };
  
  // Update review progress when analysis status updates
  useEffect(() => {
    // Handle completion first - this takes priority
    if (analysisStatus.status === 'completed' && (isComprehensiveReview || isSelectiveReview) && !hasAnalysisCompleted) {
      console.log('Analysis completed - marking all reviews as completed');
      setReviewProgress(prev => 
        prev.map(item => ({ ...item, status: 'completed' }))
      );
      
      if (pollingIntervalId) {
        stopStatusPolling();
      }
      setIsAnalyzing(false);
      
      // If completed, fetch results and dispatch event
      if (analysisStatus.jobId) {
        // Get analysis results
        dispatch(getAnalysisResults(analysisStatus.jobId));
        
        // Mark the file as processed
        dispatch(markFileProcessed({ fileId }));
        
        // Notify parent component that analysis is completed
        window.dispatchEvent(new CustomEvent('analysisCompleted', { 
          detail: { fileId, status: 'completed', progress: 100 } 
        }));
      }
      setHasAnalysisCompleted(true); // Mark as completed to prevent re-execution
      return; // Exit early - don't process individual progress updates
    }
    
    // Handle failure
    if (analysisStatus.status === 'failed') {
      if (pollingIntervalId) {
        stopStatusPolling();
      }
      setIsAnalyzing(false);
      
      // Mark the current review as failed
      if ((isComprehensiveReview || isSelectiveReview) && currentReview) {
        setReviewProgress(prev => 
          prev.map(item => 
            item.reviewType === currentReview ? 
              { ...item, status: 'failed' } : 
              item
          )
        );
      }
      return; // Exit early
    }
    
    // Handle normal progress updates (only if not completed/failed)
    if (analysisStatus.currentReview && (isComprehensiveReview || isSelectiveReview) && 
        analysisStatus.status !== 'completed' && analysisStatus.status !== 'failed') {
      // Update the current review
      setCurrentReview(analysisStatus.currentReview);
      
      // Update the progress of individual reviews
      setReviewProgress(prev => {
        return prev.map((item, itemIndex) => {
          const currentReviewIndexFromBackend = analysisStatus.currentIndex || 0; // This is 1-based

          // If this review's 0-based index is less than the 0-based index of the current review from backend, it's completed
          if (currentReviewIndexFromBackend > 1 && itemIndex < (currentReviewIndexFromBackend - 1) && item.status !== 'failed') {
            return { ...item, status: 'completed' };
          }
          // If this review is the one currently being processed (0-based index matches 1-based current index - 1)
          else if (currentReviewIndexFromBackend > 0 && itemIndex === (currentReviewIndexFromBackend - 1) && item.status !== 'failed') {
            return { ...item, status: analysisStatus.reviewStatus || 'in_progress' };
          }
          // If this review is the one that just completed (based on currentAnalysisStatus.currentReview)
          else if (item.reviewType === analysisStatus.currentReview && analysisStatus.reviewStatus === 'completed') {
            return { ...item, status: 'completed' };
          }
          return item;
        });
      });
    }
  }, [analysisStatus.status, analysisStatus.currentReview, analysisStatus.jobId, analysisStatus.reviewStatus, analysisStatus.currentIndex, dispatch, fileId, pollingIntervalId, isComprehensiveReview, isSelectiveReview, currentReview]);
  
  // Safety check: ensure isAnalyzing is reset when analysis completes or fails
  useEffect(() => {
    if (analysisStatus.status === 'completed' || analysisStatus.status === 'failed') {
      setIsAnalyzing(false);
    }
  }, [analysisStatus.status]);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
      
      // Unsubscribe from any active job subscriptions
      if (analysisStatus.jobId) {
        websocketService.unsubscribeFromJob(analysisStatus.jobId);
      }
    };
  }, [pollingIntervalId, analysisStatus.jobId]);
  
  // Get the name of the current review
  const getCurrentReviewName = () => {
    // If analysis is completed, show the last category (A10)
    if (analysisStatus.status === 'completed') {
      return OWASP_CATEGORIES[OWASP_CATEGORIES.length - 1].name;
    }
    
    const category = OWASP_CATEGORIES.find(cat => cat.id === currentReview);
    return category ? category.name : 'Code Analysis';
  };
  
  // Mark file as processed after all reviews are completed
  useEffect(() => {
    if (
      reviewProgress.every(item => item.status === 'completed') &&
      analysisStatus.status === 'completed'
    ) {
      dispatch(markFileProcessed({ fileId }));
    }
  }, [reviewProgress, analysisStatus.status, dispatch, fileId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      
      {/* Analysis Buttons */}
      <div className="space-y-4 mb-4">
        {/* Comprehensive Review Button */}
        <button 
          className={`w-full px-4 py-2 rounded-md flex items-center justify-center ${
            isAnalyzing || analysisStatus.status === 'analyzing'
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          onClick={handleStartComprehensiveReview}
          disabled={isAnalyzing || analysisStatus.status === 'analyzing'}
        >
          {isAnalyzing && isComprehensiveReview ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Reviewing...
            </>
          ) : (
            <>
              <ShieldCheckIcon className="h-5 w-5 mr-1" />
              OWASP 2021 Top 10 Security Risks (All)
            </>
          )}
        </button>

        {/* Selective Review Toggle */}
        <div className="border-t dark:border-gray-600 pt-4">
          <button
            onClick={() => setShowSelectiveOptions(!showSelectiveOptions)}
            className="w-full flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md"
          >
            <span className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Selective Code Review
            </span>
            {showSelectiveOptions ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
          
          {showSelectiveOptions && (
            <div className="mt-4 space-y-4">
              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                >
                  Select All
                </button>
                <button
                  onClick={handleSelectNone}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                >
                  Select None
                </button>
                <button
                  onClick={handleSelectSecurityOnly}
                  className="px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md"
                >
                  Security Only
                </button>
                <button
                  onClick={handleSelectGeneralOnly}
                  className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md"
                >
                  General Only
                </button>
              </div>

              {/* Review Type Checkboxes */}
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                {OWASP_CATEGORIES.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md cursor-pointer"
                    title={category.description}
                  >
                    <input
                      type="checkbox"
                      checked={selectedReviewTypes.includes(category.id)}
                      onChange={() => handleReviewTypeToggle(category.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {category.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Selected Count and Start Button */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedReviewTypes.length} review{selectedReviewTypes.length !== 1 ? 's' : ''} selected
                  {selectedReviewTypes.length > 0 && (
                    <span className="ml-2 text-xs">
                      (Est. {Math.ceil(selectedReviewTypes.length * 1.5)} min)
                    </span>
                  )}
                </span>
                <button
                  onClick={handleStartSelectiveReview}
                  disabled={selectedReviewTypes.length === 0 || isAnalyzing || analysisStatus.status === 'analyzing'}
                  className={`px-4 py-2 rounded-md text-sm flex items-center ${
                    selectedReviewTypes.length === 0 || isAnalyzing || analysisStatus.status === 'analyzing'
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isAnalyzing && isSelectiveReview ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                      Reviewing...
                    </>
                  ) : (
                    'Start Review'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {analysisError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
          {analysisError}
        </div>
      )}
      
      {/* Analysis Status */}
      {(analysisStatus.status !== 'pending' || analysisStatus.progress > 0) && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              <span>
                {isSelectiveReview ? 'Selective' : 'OWASP'} Review: {getCurrentReviewName()}
                {analysisStatus.currentIndex && analysisStatus.totalReviews && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({analysisStatus.currentIndex}/{analysisStatus.totalReviews})
                  </span>
                )}
              </span>
            </span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {analysisStatus.status === 'completed' ? '100' : analysisStatus.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                analysisStatus.status === 'failed' 
                  ? 'bg-red-600' 
                  : analysisStatus.status === 'completed'
                    ? 'bg-green-600'
                    : 'bg-blue-600'
              }`}
              style={{ width: `${analysisStatus.status === 'completed' ? '100' : analysisStatus.progress}%` }}
            ></div>
          </div>
          
          {/* Display status of current review */}
          {(isComprehensiveReview || isSelectiveReview) && analysisStatus.reviewStatus && (
            <div className="mt-1 text-sm">
              <span className={`
                ${analysisStatus.reviewStatus === 'completed' ? 'text-green-600 dark:text-green-400' :
                  analysisStatus.reviewStatus === 'failed' ? 'text-red-600 dark:text-red-400' :
                  'text-blue-600 dark:text-blue-400'}
              `}>
                Current review status: {analysisStatus.reviewStatus}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Review Progress */}
      {(isComprehensiveReview || isSelectiveReview) && analysisStatus.status !== 'pending' && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isSelectiveReview ? 'Selected Reviews Progress:' : 'Review Progress:'}
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {reviewProgress.map((review) => (
              <div 
                key={review.reviewType} 
                className={`flex items-center gap-2 p-2 rounded-md ${
                  review.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' :
                  review.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  review.status === 'failed' ? 'bg-red-100 dark:bg-red-900/20' :
                  'bg-gray-100 dark:bg-gray-700/50'
                }`}
              >
                {review.status === 'completed' ? (
                  <span className="text-green-600 dark:text-green-400">✓</span>
                ) : review.status === 'in_progress' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
                ) : review.status === 'failed' ? (
                  <span className="text-red-600 dark:text-red-400">✗</span>
                ) : (
                  <span className="text-gray-400">○</span>
                )}
                <span className={`text-sm ${
                  review.status === 'completed' ? 'text-green-700 dark:text-green-300' :
                  review.status === 'in_progress' ? 'text-blue-700 dark:text-blue-300' :
                  review.status === 'failed' ? 'text-red-700 dark:text-red-300' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {OWASP_CATEGORIES.find(cat => cat.id === review.reviewType)?.name || review.reviewType}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
