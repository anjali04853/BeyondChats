import React, { useState, useEffect } from 'react';
import { Article, EnhancedArticle } from '../types';
import { articlesApi } from '../api/client';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack }) => {
  const [enhanced, setEnhanced] = useState<EnhancedArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEnhanced, setShowEnhanced] = useState(false);

  useEffect(() => {
    const fetchEnhanced = async () => {
      setLoading(true);
      try {
        const enhancedArticle = await articlesApi.getEnhanced(article.id);
        setEnhanced(enhancedArticle);
      } catch (err) {
        console.error('Error fetching enhanced article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnhanced();
  }, [article.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentContent = showEnhanced && enhanced ? enhanced.enhanced_content : article.content;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Articles
      </button>

      <article className="bg-white rounded-lg shadow-md p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span>{article.author || 'Unknown author'}</span>
            <span>•</span>
            <span>{formatDate(article.publication_date)}</span>
          </div>
        </header>

        {enhanced && !loading && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setShowEnhanced(false)}
              className={`px-4 py-2 rounded-md transition-colors ${
                !showEnhanced
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setShowEnhanced(true)}
              className={`px-4 py-2 rounded-md transition-colors ${
                showEnhanced
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Enhanced
            </button>
          </div>
        )}

        <div className="prose prose-lg max-w-none">
          {currentContent.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {showEnhanced && enhanced && enhanced.reference_urls.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">References</h3>
            <ul className="space-y-2">
              {enhanced.reference_urls.map((url, index) => (
                <li key={index}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="mt-8 pt-6 border-t border-gray-200">
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            View Original Source
          </a>
        </footer>
      </article>
    </div>
  );
};
