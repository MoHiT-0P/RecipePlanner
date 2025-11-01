import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

// Page Imports
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import SavedRecipes from './pages/SavedRecipes';
import RecipeGenerator from './pages/RecipeGenerator';
import MyDiet from './pages/MyDiet';
import MealPlanner from './pages/MealPlanner/MealPlanner';

// Component Imports
import Sidebar from './components/Sidebar';

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800">
        <div className="text-xl font-semibold dark:text-gray-200">Loading App...</div>
      </div>
    );
  }

  return user ? <RecipePlanner user={user} /> : <Auth />;
}

// Recipe Planner Component
const RecipePlanner = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');

  // Fetch all recipes once
  useEffect(() => {
    const fetchRecipes = async () => {
        const querySnapshot = await getDocs(collection(db, "recipes"));
        const recipesList = querySnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() }));
        setRecipes(recipesList);
    };
    fetchRecipes();
  }, []);
  
  // Listen for real-time updates on user data (including goals)
  useEffect(() => {
      if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  setUserData({ id: docSnap.id, ...docSnap.data() });
              }
              if(loading) setLoading(false);
          });
          return () => unsubscribe();
      }
  }, [user]);

  const handleLogout = () => { signOut(auth).catch(error => console.error('Logout Error:', error)); };
  
  const handleSaveRecipe = async (recipeId) => {
    if (!userData) return;
    const userDocRef = doc(db, 'users', user.uid);
    const isSaved = userData.savedRecipes?.includes(recipeId);
    try {
      await updateDoc(userDocRef, {
        savedRecipes: isSaved ? arrayRemove(recipeId) : arrayUnion(recipeId)
      });
    } catch (error) { console.error("Error updating saved recipes:", error); }
  };
  
  if (loading || !userData || !recipes.length) {
    return ( <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800"><div className="text-xl font-semibold dark:text-gray-200">Loading your dashboard...</div></div> );
  }

  const renderContent = () => {
    // THE FIX IS HERE: Correctly pass the handleSaveRecipe function
    const commonProps = { user, userData, recipes, onSaveRecipe: handleSaveRecipe };
    switch (currentPage) {
      case 'home':
        return <Dashboard {...commonProps} />;
      case 'mealPlanner':
        return <MealPlanner {...commonProps} />;
      case 'savedRecipes':
        return <SavedRecipes {...commonProps} />;
      case 'recipeGenerator':
        return <RecipeGenerator allRecipes={recipes} {...commonProps} />;
      case 'myDiet':
        // Pass userData to MyDiet
        return <MyDiet user={user} userData={userData} recipes={recipes} />;
      case 'admin':
        return userData.role === 'admin' ? <Admin /> : <div>Access Denied</div>;
      default:
        return <div className="p-8"><h1 className="text-2xl font-bold dark:text-gray-100">Page not found</h1></div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 font-sans">
      <Sidebar onNavigate={setCurrentPage} onLogout={handleLogout} isAdmin={userData.role === 'admin'} />
      <div className="flex-1 overflow-y-auto p-8">{renderContent()}</div>
    </div>
  );
};

