import { getDatabase } from './connection';

const seedArticles = () => {
  const db = getDatabase();
  
  // Check if articles already exist
  const count = db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number };
  
  if (count.count > 0) {
    console.log('✅ Database already seeded with articles');
    return;
  }

  console.log('🌱 Seeding database with articles...');

  const articles = [
    {
      title: 'AI in Healthcare: Hype or Reality?',
      content: 'Explainable AI is definitely the way forward. At its current state, it should be seen more as an Assistive Intelligence rather than Artificial Intelligence.',
      author: 'Simran Jain',
      publication_date: '2025-03-25',
      source_url: 'https://beyondchats.com/blogs/ai-in-healthcare-hype-or-reality/',
    },
    {
      title: 'Your website needs a receptionist',
      content: 'So true! Not having an interactive element like chatbot on a website significantly reduces traffic retention.',
      author: 'pankaj',
      publication_date: '2025-03-25',
      source_url: 'https://beyondchats.com/blogs/your-website-needs-a-receptionist/',
    },
    {
      title: 'What If AI Recommends the Wrong Medicine – Who\'s to Blame?',
      content: 'Introduction: The Unspoken Fear AI is changing the world fast. In many industries, it\'s already improving speed, accuracy, and efficiency. In healthcare, it\'s no different.',
      author: 'Simran Jain',
      publication_date: '2025-03-24',
      source_url: 'https://beyondchats.com/blogs/what-if-ai-recommends-the-wrong-medicine-whos-to-blame/',
    },
    {
      title: 'What If AI Recommends the Wrong Medicine – Who\'s Responsible?',
      content: 'Introduction: The Unspoken Fear AI is changing the world fast. In many industries, it\'s already improving speed, accuracy, and efficiency. In healthcare, it\'s no different.',
      author: 'Simran Jain',
      publication_date: '2025-03-24',
      source_url: 'https://beyondchats.com/blogs/what-if-ai-recommends-the-wrong-medicine-whos-to-blame-2/',
    },
    {
      title: 'Will AI Understand the Complexities of Patient Care?',
      content: 'Very well written. But I feel it\'s only a matter of time when AI starts understanding patient nuances much better. Doctors are already super tired and overworked.',
      author: 'Simran Jain',
      publication_date: '2025-04-03',
      source_url: 'https://beyondchats.com/blogs/will-ai-understand-the-complexities-of-patient-care/',
    },
  ];

  const insertStmt = db.prepare(`
    INSERT INTO articles (title, content, author, publication_date, source_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  articles.forEach((article) => {
    insertStmt.run(
      article.title,
      article.content,
      article.author,
      article.publication_date,
      article.source_url,
      new Date().toISOString()
    );
  });

  console.log(`✅ Seeded ${articles.length} articles`);
};

export { seedArticles };
