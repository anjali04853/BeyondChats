import React, { useState } from 'react';
import { Article } from './types';
import { ArticleList } from './components/ArticleList';
import { ArticleDetail } from './components/ArticleDetail';

export const App: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 
              className="text-xl sm:text-2xl font-bold text-gray-900 cursor-pointer"
              onClick={() => setSelectedArticle(null)}
            >
              BeyondChats Articles
            </h1>
            {selectedArticle && (
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-sm text-blue-600 hover:text-blue-800 sm:hidden"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {selectedArticle ? (
          <ArticleDetail
            article={selectedArticle}
            onBack={() => setSelectedArticle(null)}
          />
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Latest Articles
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Browse articles scraped from BeyondChats blog with AI-enhanced versions.
              </p>
            </div>
            <ArticleList onSelectArticle={setSelectedArticle} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            BeyondChats Article Scraper © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
