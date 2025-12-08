import React, { useState, useEffect } from 'react';
// Using the import that we know works for App.jsx
import { auth, db } from './firebase.js'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot,
  addDoc,
  Timestamp,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

// Page Imports
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SavedRecipes from './pages/SavedRecipes.jsx';
import RecipeGenerator from './pages/RecipeGenerator.jsx';
import MyDiet from './pages/MyDiet.jsx';
import MealPlanner from './pages/MealPlanner/MealPlanner.jsx';

// Component Imports
import Sidebar from './components/Sidebar.jsx';

// --- Helper Function ---
const toLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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

  // --- AI State ---
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  // Fetch all recipes
  useEffect(() => {
    const fetchRecipes = async () => {
        const querySnapshot = await getDocs(collection(db, "recipes"));
        const recipesList = querySnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() }));
        setRecipes(recipesList);
    };
    fetchRecipes();
  }, []);
  
  // Listen for user data
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
  
  const handleLogMeal = async (recipe, date, mealType) => {
    if (!user || !recipe || !date || !mealType) {
      console.error("Missing data for logging meal");
      return;
    }
    try {
      const planDate = new Date(date + 'T00:00:00');
      const mealPlanRef = collection(db, `users/${user.uid}/mealPlan`);
      
      await addDoc(mealPlanRef, {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        date: Timestamp.fromDate(planDate),
        mealType: mealType,
        calories: recipe.totalCalories || 0,
        createdAt: Timestamp.now(),
        imageUrl: recipe.imageUrl || '',
      });
    } catch (err) {
      console.error("Detailed error adding to meal plan: ", err);
    }
  };

  const handleGenerateWeeklyPlan = async (useAllRecipes) => {
    setIsGeneratingPlan(true);
    setGenerationError(null);

    const nextSevenDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        nextSevenDays.push(date);
    }

    let availableRecipes = [];
    let systemPromptContext = "";

    if (useAllRecipes) {
        console.log("Generating in DISCOVERY mode");
        const userDiet = userData.dietaryType || 'none';
        availableRecipes = recipes
            .filter(r => 
                userDiet === 'none' || 
                !r.dietaryType || 
                r.dietaryType === 'none' || 
                r.dietaryType === userDiet
            )
            .map(r => ({ id: r.id, title: r.title, calories: r.totalCalories || 0 }));
        
        const savedRecipeIds = userData.savedRecipes || [];
        const favoriteRecipes = availableRecipes.filter(r => savedRecipeIds.includes(r.id));

        systemPromptContext = `
          - You MUST use recipes from the 'availableRecipes' list.
          - The user has these 'favoriteRecipes': ${JSON.stringify(favoriteRecipes)}
          - You should *prioritize* using the 'favoriteRecipes' where they fit, but you are free to use any recipe from the 'availableRecipes' list to meet the user's goals and provide variety.
        `;

    } else {
        console.log("Generating in SAFE mode");
        const savedRecipeIds = userData.savedRecipes || [];
        
        if (savedRecipeIds.length < 7) {
            setGenerationError("Not enough saved recipes. Save at least 7, or check the 'Discover New Recipes' box.");
            setIsGeneratingPlan(false);
            return false;
        }
        
        availableRecipes = recipes
            .filter(r => savedRecipeIds.includes(r.id))
            .map(r => ({ id: r.id, title: r.title, calories: r.totalCalories || 0 }));
        
        systemPromptContext = `- You MUST *only* use recipe IDs from the 'availableRecipes' list.`;
    }

    try {
      const startOfRange = nextSevenDays[0]; 
      const endOfRange = new Date(nextSevenDays[6]);
      endOfRange.setHours(23, 59, 59, 999); 

      const mealPlanRef = collection(db, `users/${user.uid}/mealPlan`);
      const q = query(mealPlanRef, 
        where("date", ">=", Timestamp.fromDate(startOfRange)), 
        where("date", "<=", Timestamp.fromDate(endOfRange))
      );
      
      const querySnapshot = await getDocs(q);
      const deleteBatch = writeBatch(db);
      querySnapshot.forEach(doc => deleteBatch.delete(doc.ref));
      await deleteBatch.commit();

    } catch (error) {
      console.error("Error clearing existing week:", error);
      setGenerationError("Failed to clear existing plan. Please try again.");
      setIsGeneratingPlan(false);
      return false;
    }
    
    const goals = userData.dietaryGoals || {};
    const dietInfo = `Target ${goals.calories || 2000} kcal/day, ${goals.protein || 100}g protein/day. Dietary preference: ${userData.dietaryType || 'none'}.`;

    const schema = {
      type: "OBJECT",
      properties: {
        weeklyPlan: {
          type: "ARRAY",
          description: "A 7-day meal plan. Each day must have one recipe ID for breakfast, lunch, and dinner.",
          items: {
            type: "OBJECT",
            properties: {
              day: { type: "STRING" },
              breakfast_id: { type: "STRING" },
              lunch_id: { type: "STRING" },
              dinner_id: { type: "STRING" }
            }
          }
        }
      }
    };

    const systemPrompt = `You are a 7-day meal planner. Your goal is to create a weekly plan that meets the user's dietary goals.
- You MUST return a JSON object matching the provided schema.
- You MUST select 3 meals for each of the 7 days.
- Try to vary the recipes and meet the user's daily calorie goal.
${systemPromptContext}`;

    const userQuery = `
      User Goals: ${dietInfo}
      Available Recipes (use these IDs): ${JSON.stringify(availableRecipes)}
      Generate the 7-day meal plan.`;

    const apiKey = 'AIzaSyBr0wjcIfQbl2Q_jT2qnL0Rjfxrk62szuE'; 
    
    if (apiKey === "YOUR_GEMINI_API_KEY_GOES_HERE") {
        console.error("Gemini API key is missing. Please add it to App.jsx.");
        setGenerationError("API key is not configured. Please add your key to App.jsx.");
        setIsGeneratingPlan(false);
        return false;
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json", 
        responseSchema: schema
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("API Error Response:", errorBody);
        throw new Error(`API call failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonText) throw new Error("No valid JSON response from AI");

      const parsedPlan = JSON.parse(jsonText);
      const aiPlan = parsedPlan.weeklyPlan;

      const addBatch = writeBatch(db);
      const mealPlanRef = collection(db, `users/${user.uid}/mealPlan`);

      aiPlan.forEach((day, index) => {
        const planDate = Timestamp.fromDate(nextSevenDays[index]);
        const meals = [
          { type: 'Breakfast', id: day.breakfast_id },
          { type: 'Lunch', id: day.lunch_id },
          { type: 'Dinner', id: day.dinner_id },
        ];

        meals.forEach(meal => {
          const recipe = recipes.find(r => r.id === meal.id);
          if (recipe) {
            const newMealRef = doc(mealPlanRef); 
            addBatch.set(newMealRef, {
              recipeId: recipe.id,
              recipeTitle: recipe.title,
              date: planDate,
              mealType: meal.type,
              calories: recipe.totalCalories || 0,
              createdAt: Timestamp.now(),
              imageUrl: recipe.imageUrl || ''
            });
          }
        });
      });

      await addBatch.commit();
      return true;

    } catch (error) {
      console.error("Error generating meal plan:", error);
      setGenerationError("AI plan generation failed. Please try again.");
      return false;
    } finally {
      setIsGeneratingPlan(false);
    }
  };
  
  if (loading || !userData || !recipes.length) {
    return ( <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800"><div className="text-xl font-semibold dark:text-gray-200">Loading your dashboard...</div></div> );
  }

  const renderContent = () => {
    const commonProps = { 
      user, 
      userData, 
      recipes, 
      onSaveRecipe: handleSaveRecipe, 
      onLogMeal: handleLogMeal,
      isGeneratingPlan,
      generationError,
      onGeneratePlan: handleGenerateWeeklyPlan,
      onNavigate: setCurrentPage,
      db: db // <-- ADDED: Passing db to all pages
    };
    
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
        return <MyDiet user={user} userData={userData} recipes={recipes} />;
      case 'admin':
        return userData.role === 'admin' ? <Admin {...commonProps} /> : <div>Access Denied</div>;
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