import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { getAnalysisStatus, getAnalysisResults, triggerComprehensiveReview } from '../features/analysisSlice';
import { markFileProcessed } from '../features/fileSlice';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import websocketService from '../services/websocket';

interface AnalysisPanelProps {
  fileId: number;
}

interface ReviewProgress {
  reviewType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

const OWASP_CATEGORIES = [
  { id: 'general_review', name: 'General Code Review' },
  { id: 'owasp_2021_a01', name: 'A01: Broken Access Control' },
  { id: 'owasp_2021_a02', name: 'A02: Cryptographic Failures' },
  { id: 'owasp_2021_a03', name: 'A03: Injection' },
  { id: 'owasp_2021_a04', name: 'A04: Insecure Design' },
  { id: 'owasp_2021_a05', name: 'A05: Security Misconfiguration' },
  { id: 'owasp_2021_a06', name: 'A06: Vulnerable Components' },
  { id: 'owasp_2021_a07', name: 'A07: Auth & Identification Failures' },
  { id: 'owasp_2021_a08', name: 'A08: Software/Data Integrity Failures' },
  { id: 'owasp_2021_a09', name: 'A09: Security Logging Failures' },
  { id: 'owasp_2021_a10', name: 'A10: Server-Side Request Forgery' },
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
  
  // Start comprehensive review (all OWASP categories)
  const handleStartComprehensiveReview = async () => {
    setIsAnalyzing(true);
    setIsComprehensiveReview(true);
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
  
  // Update review progress when analysis status updates
  useEffect(() => {
    // Handle completion first - this takes priority
    if (analysisStatus.status === 'completed' && isComprehensiveReview && !hasAnalysisCompleted) {
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
      if (isComprehensiveReview && currentReview) {
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
    if (analysisStatus.currentReview && isComprehensiveReview && 
        analysisStatus.status !== 'completed' && analysisStatus.status !== 'failed') {
      // Update the current review
      setCurrentReview(analysisStatus.currentReview);
      
      // Update the progress of individual reviews
      setReviewProgress(prev => {
        return prev.map((item, itemIndex) => {
          const reviewTypes = OWASP_CATEGORIES.map(cat => cat.id);
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
  }, [analysisStatus.status, analysisStatus.currentReview, analysisStatus.jobId, analysisStatus.reviewStatus, analysisStatus.currentIndex, dispatch, fileId, pollingIntervalId, isComprehensiveReview, currentReview]);
  
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
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          className={`px-4 py-2 rounded-md flex items-center ${
            isAnalyzing || analysisStatus.status === 'analyzing'
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          onClick={handleStartComprehensiveReview}
          disabled={isAnalyzing || analysisStatus.status === 'analyzing'}
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Reviewing...
            </>
          ) : (
            <>
              <ShieldCheckIcon className="h-5 w-5 mr-1" />
              OWASP 2021 Top 10 Security Risks
            </>
          )}
        </button>
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
                OWASP Review: {getCurrentReviewName()}
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
          {isComprehensiveReview && analysisStatus.reviewStatus && (
            <div className="mt-1 text-sm">
              <span className={`
                ${(analysisStatus.reviewStatus === 'completed' && analysisStatus.currentReview === 'owasp_2021_a10') ? 'text-green-600 dark:text-green-400' :
                  analysisStatus.reviewStatus === 'failed' ? 'text-red-600 dark:text-red-400' :
                  'text-blue-600 dark:text-blue-400'}
              `}>
                Current review status: {
                  (analysisStatus.reviewStatus === 'completed' && analysisStatus.currentReview !== 'owasp_2021_a10')
                    ? 'in_progress'
                    : analysisStatus.reviewStatus
                }
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Review Progress */}
      {isComprehensiveReview && analysisStatus.status !== 'pending' && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review Progress:</h3>
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
