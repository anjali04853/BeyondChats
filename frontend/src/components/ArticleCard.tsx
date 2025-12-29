import React from 'react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {article.title}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {article.content.substring(0, 150)}...
      </p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{article.author || 'Unknown author'}</span>
        <span>{formatDate(article.publication_date)}</span>
      </div>
    </div>
  );
};
