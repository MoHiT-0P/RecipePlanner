import React, { useState } from 'react';
// UPDATED PATH: Go up two levels to find firebase in the root
import { auth, db } from '../firebase.js'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; 
import { Soup, ArrowLeft } from 'lucide-react';
import LandingPage from './LandingPage.jsx'; // Added .jsx extension

const Auth = () => {
    // 'landing', 'login', or 'signup'
    const [view, setView] = useState('landing'); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (view === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                // Create a document for the new user
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    createdAt: serverTimestamp(),
                    role: 'user', 
                    recipesCooked: 0,
                    weekStreak: 0,
                    caloriesToday: 0,
                    savedRecipes: [],
                });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    // If view is 'landing', show the landing page
    if (view === 'landing') {
        return (
            <LandingPage 
                onGetStarted={() => setView('signup')} 
                onSignIn={() => setView('login')} 
            />
        );
    }

    // Otherwise, show the Auth Form (Login or Signup)
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg relative">
                
                {/* Back Button */}
                <button 
                    onClick={() => setView('landing')}
                    className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="text-center">
                    <Soup size={48} className="mx-auto text-green-500"/>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {view === 'login' ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {view === 'login' ? 'Sign in to continue to your kitchen' : 'Start your AI cooking journey today'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-lg shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-400 text-gray-900 dark:text-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-400 text-gray-900 dark:text-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all hover:shadow-lg"
                        >
                            {view === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </div>
                </form>
                
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button 
                            onClick={() => setView(view === 'login' ? 'signup' : 'login')} 
                            className="font-bold text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        >
                            {view === 'login' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;