import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// @ts-ignore - Types will be available at runtime after install
import ReactMarkdown from 'react-markdown';

const StaticPage = () => {
  const { pageName } = useParams<{ pageName: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        // Use a timestamp to prevent caching issues
        const response = await fetch(`/static/${pageName}.md?t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load page: ${response.statusText}`);
        }
        
        const text = await response.text();
        // Remove any HTML comment lines (like file path comment)
        const cleanedText = text.replace(/<!--.*?-->/g, '');
        setContent(cleanedText);
        setError(null);
      } catch (err) {
        console.error('Error loading static page:', err);
        setError('Failed to load the page content.');
      } finally {
        setLoading(false);
      }
    };

    if (pageName) {
      fetchContent();
    }
  }, [pageName]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/3 mb-6 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 mb-3 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 mb-3 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 w-4/5 mb-3 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Error</h2>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <article className="markdown-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
};


export default StaticPage;
