import React from 'react';
import { Article, EnhancedArticle } from '../types';

interface ComparisonViewProps {
  article: Article;
  enhanced: EnhancedArticle;
  onBack: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ article, enhanced, onBack }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Articles
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{article.title}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Article */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Original</h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              {formatDate(article.publication_date)}
            </span>
          </div>
          <div className="prose prose-sm max-w-none">
            {article.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3 text-gray-700">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Enhanced Article */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-600">Enhanced</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
              {formatDate(enhanced.enhancement_date)}
            </span>
          </div>
          <div className="prose prose-sm max-w-none">
            {enhanced.enhanced_content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3 text-gray-700">
                {paragraph}
              </p>
            ))}
          </div>
          
          {enhanced.reference_urls.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">References</h3>
              <ul className="space-y-1">
                {enhanced.reference_urls.map((url, index) => (
                  <li key={index}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate block"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
