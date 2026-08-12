"use client";

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Search, Calendar, Clock, User, ArrowLeft, ArrowRight } from 'lucide-react';

const BLOG_POSTS = [
  {
    id: 1,
    title: 'How to Choose the Right Home Tutor for Your Child',
    excerpt: 'Finding the perfect tutor goes beyond qualifications. Here are key things parents should evaluate before hiring.',
    content: `
      Finding the perfect tutor for your child is a crucial decision that can significantly impact their academic journey and self-confidence. While academic qualifications are important, they are only part of the equation.

      ### 1. Identify Your Goals
      Before you start searching, clearly define what you want to achieve. Is your child struggling to keep up, or do they need help preparing for a specific competitive exam like JEE or NEET? Do they need help with homework, or are they looking for advanced enrichment?

      ### 2. Look for Teaching Experience
      A tutor might be a subject expert, but explaining complex topics to a young student requires patience and pedagogical skills. Look for tutors who have experience teaching your child's specific class level or board (CBSE, ICSE, etc.).

      ### 3. Check for Safety & Verifications
      Since a home tutor will be coming to your house, safety is paramount. Platforms like Verified Tutor screen educators by verifying their government IDs and academic credentials, giving parents peace of mind.

      ### 4. Assess Communication Style and Attitude
      During the first demo class, observe how the tutor interacts with your child. A good tutor should be encouraging, patient, and capable of explaining concepts in multiple ways if the child doesn't understand the first time.
    `,
    category: 'Parents Guide',
    author: 'Sunita Sharma',
    role: 'Parenting Consultant',
    date: 'Aug 08, 2026',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=60'
  },
  {
    id: 2,
    title: '5 Effective Study Habits for Class 10 Board Exams',
    excerpt: 'Prepare strategically for your boards. Learn how to manage time, structure study notes, and write optimal responses.',
    content: `
      Board exams can be stressful, but with the right study strategies, you can ace them with flying colors. Here are 5 scientifically proven study habits that will help you prepare effectively:

      ### 1. Use Active Recall
      Instead of just reading and re-reading your textbooks, test yourself. Close the book and write down everything you remember, or explain the concept to someone else. This builds stronger neural connections.

      ### 2. Follow the Pomodoro Technique
      Study in focused bursts of 25 minutes, followed by a 5-minute break. After four cycles, take a longer break of 15-30 minutes. This prevents cognitive fatigue and keeps your mind fresh.

      ### 3. Solve Mock Papers Under Real Exam Conditions
      Success in board exams isn't just about what you know; it's also about managing your time. Practice solving previous years' papers in a quiet room with a 3-hour timer.

      ### 4. Organize Your Study Workspace
      Keep your study desk clutter-free. Ensure you have proper lighting, comfortable seating, and keep all distractions (especially your phone!) in another room.

      ### 5. Prioritize Sleep and Nutrition
      Your brain needs fuel and rest to function at its best. Get at least 7-8 hours of sleep before the exam, and eat light, nutritious meals.
    `,
    category: 'Study Tips',
    author: 'Rahul Verma',
    role: 'Physics & Maths Tutor',
    date: 'Aug 05, 2026',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60'
  },
  {
    id: 3,
    title: 'Top Tutors Strategies to Make Maths Simple and Fun',
    excerpt: 'Mathematics does not have to be scary. Read our verified tutors strategies on making algebra and geometry engaging.',
    content: `
      Math anxiety is real, but it is entirely manageable. When students struggle with mathematics, it is usually because they missed a foundational concept early on. Here is how our expert tutors make maths simple:

      ### 1. Concrete to Abstract Transition
      Tutors start with physical props, real-world examples, or drawings before introducing abstract formulas. Understanding *why* a formula works makes it easy to remember.

      ### 2. gamified Learning
      Using math puzzles, logic games, and interactive challenges transforms problem-solving from a chore into a rewarding puzzle.

      ### 3. Relate to Real-Life Applications
      Whether calculating discounts at a supermarket, estimating travel times, or understanding sports stats, linking algebra and geometry to real life builds instant interest.

      ### 4. Practice Structured Steps
      Encourage students to write down every step of their working out. This helps identify exactly where an error occurred, making correction educational rather than discouraging.
    `,
    category: 'Tutor Strategies',
    author: 'Dr. Amit Patel',
    role: 'Senior Maths Educator',
    date: 'Jul 30, 2026',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60'
  },
  {
    id: 4,
    title: 'JEE Main 2027: How to Plan Your Preparation Early',
    excerpt: 'Crack the JEE with a long-term strategy. Learn the syllabus breakdown, subject priorities, and resource choices.',
    content: `
      Cracking JEE Main requires a disciplined approach, consistent practice, and deep conceptual clarity. Starting early gives you a massive competitive advantage.

      ### 1. Master NCERT First
      Many students make the mistake of jumping directly to complex reference books. NCERT Chemistry and Physics form the core of the JEE syllabus. Ensure you know every concept and exercise by heart.

      ### 2. Focus on Conceptual Understanding
      JEE tests your ability to apply concepts to unfamiliar problems. Avoid memorizing shortcuts without understanding the derivation behind them.

      ### 3. Consistent Practice is Key
      Solve at least 30-40 physics, chemistry, and mathematics questions daily. Make note of challenging questions and revise them regularly.

      ### 4. Hire a Specialized JEE Tutor
      Having a personal mentor who has successfully guided students through JEE can save months of trial and error. A tutor helps clear doubts instantly and keeps your prep on track.
    `,
    category: 'Exam Prep',
    author: 'Vikas Gupta',
    role: 'IIT JEE Coach',
    date: 'Jul 28, 2026',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'
  }
];

const API = process.env.NEXT_PUBLIC_API_URL || ' ';
const CATEGORIES = ['All', 'Parents Guide', 'Study Tips', 'Tutor Strategies', 'Exam Prep'];

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/v1/blogs`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBlogs(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = blogs.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-slate-50 relative flex flex-col justify-between">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-emerald-50/40 via-transparent to-transparent pointer-events-none z-0" />

      <Navbar />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {selectedPost ? (
          /* Detailed Post View */
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 p-6 md:p-10 shadow-xl">
            <button 
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition mb-6"
            >
              <ArrowLeft size={16} />
              <span>Back to Articles</span>
            </button>

            <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#056852] text-xs font-bold uppercase tracking-wider">
              {selectedPost.category}
            </span>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 leading-tight">
              {selectedPost.title}
            </h1>

            {/* Author info */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <User size={14} />
                <span className="font-bold text-slate-600">{selectedPost.author}</span>
                <span className="text-slate-300">({selectedPost.role})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>{selectedPost.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>{selectedPost.readTime}</span>
              </div>
            </div>

            {/* Post Image */}
            <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mt-6 shadow-inner">
              <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
            </div>

            {/* Post Content */}
            <article className="mt-8 text-slate-600 text-sm md:text-base leading-relaxed space-y-6 whitespace-pre-line">
              {selectedPost.content}
            </article>
          </div>
        ) : (
          /* List View */
          <div>
            {/* Header info */}
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
                Resources & Guide
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Verified Tutor Blog</h1>
              <p className="mt-3 text-sm text-slate-500">
                Insights, strategies, and guides for parenting, teaching excellence, and exam success.
              </p>
            </div>

            {/* Search & Categories Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8">
              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-[#056852] text-white'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                />
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
              </div>
            </div>

            {/* Blog Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#056852] border-t-transparent" />
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
                {filteredPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                    <div>
                      {/* Image */}
                      <div className="w-full h-48 overflow-hidden relative">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-800 uppercase tracking-wider shadow">
                          {post.category}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 hover:text-[#056852] transition cursor-pointer" onClick={() => setSelectedPost(post)}>
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-2 line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0 border-t border-slate-50 flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#056852] text-xs font-bold flex items-center justify-center border border-emerald-100">
                          {post.author.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{post.author}</span>
                      </div>

                      <button 
                        onClick={() => setSelectedPost(post)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#056852] hover:text-emerald-700 transition"
                      >
                        <span>Read More</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                <p className="text-sm font-semibold text-slate-400">No articles found matching your query.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Verified Tutor. All Rights Reserved.
        </div>
      </footer>
    </main>
  );
}
