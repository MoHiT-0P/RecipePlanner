import React, { useState, useEffect } from 'react';
import { Soup, ChefHat, CalendarDays, Sparkles, ArrowRight, CheckCircle2, Moon, Sun } from 'lucide-react';

const LandingPage = ({ onGetStarted, onSignIn }) => {
  // Initialize theme from system preference or default to light
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference on mount
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  return (
    // Apply 'dark' class conditionally to the wrapper
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* --- Navigation --- */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg transition-colors">
                <Soup className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                RecipeAI
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button 
                onClick={onSignIn}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={onGetStarted}
                className="hidden sm:flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition-all bg-green-600 rounded-full hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-green-300/20 dark:bg-green-900/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-normal filter animate-blob"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-blue-300/20 dark:bg-blue-900/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-normal filter animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300/20 dark:bg-purple-900/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-normal filter animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 backdrop-blur-sm transition-colors">
            <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Powered by Gemini AI
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-gray-900 dark:text-white transition-colors">
            Your Personal <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400">
              AI Chef & Nutritionist
            </span>
          </h1>
          
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300 transition-colors">
            Stop worrying about "What's for dinner?". Let AI generate personalized recipes, 
            plan your weekly meals, and track your nutrition instantly.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 text-lg font-bold text-white transition-all bg-green-600 rounded-full hover:bg-green-700 hover:shadow-xl hover:-translate-y-1 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Start Cooking Free <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mock Interface Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl">
             <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-teal-400 rounded-2xl blur opacity-20 dark:opacity-40 transition-opacity"></div>
             <div className="relative rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                {/* Simple Mock UI Header */}
                <div className="h-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2 transition-colors">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                {/* Content Placeholder */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50 pointer-events-none select-none">
                    <div className="space-y-4">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 transition-colors"></div>
                        <div className="h-32 bg-gray-100 dark:bg-gray-700/50 rounded-xl transition-colors"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full transition-colors"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 transition-colors"></div>
                    </div>
                    <div className="space-y-4 md:col-span-2">
                        <div className="h-64 bg-green-50 dark:bg-green-900/10 rounded-xl border-2 border-dashed border-green-200 dark:border-green-800 flex items-center justify-center transition-colors">
                            <span className="text-green-600 dark:text-green-400 font-medium">AI Meal Plan Generation in progress...</span>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- Features Grid --- */}
      <section className="py-24 bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl transition-colors">
              Everything you need to eat better
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 transition-colors">
              Powerful tools to simplify your kitchen routine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="group p-8 bg-gray-50 dark:bg-gray-900 rounded-3xl transition-all hover:bg-white dark:hover:bg-gray-800/80 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 duration-300">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ChefHat className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">Smart Recipe Generator</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">
                Got leftover ingredients? Enter them into our AI, and get instant, gourmet recipe suggestions that reduce waste and taste great.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-gray-50 dark:bg-gray-900 rounded-3xl transition-all hover:bg-white dark:hover:bg-gray-800/80 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 duration-300">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">One-Click Meal Planning</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">
                Generate a full week's meal plan based on your calorie goals and dietary preferences in seconds. No more spreadsheet planning.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-gray-50 dark:bg-gray-900 rounded-3xl transition-all hover:bg-white dark:hover:bg-gray-800/80 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 duration-300">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">Track Your Nutrition</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">
                Stay on top of your health goals with automatic calorie tracking and macro monitoring for every meal you plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-gray-50 dark:bg-gray-900 py-12 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 transition-colors">
            © {new Date().getFullYear()} RecipeAI. Cooking made intelligent.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;