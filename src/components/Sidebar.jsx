import React from 'react';
import { Home, LogOut, ChefHat, BookMarked, CookingPot, Users as AdminUsers, CalendarDays } from 'lucide-react';
import { Soup } from 'lucide-react';
import NavItem from './NavItem';
import ThemeToggle from './ThemeToggle';

const Sidebar = ({ onNavigate, onLogout, isAdmin }) => {
    return (
        <div className="w-64 bg-white dark:bg-gray-900 shadow-md flex flex-col border-r dark:border-gray-700">
            <div className="p-6 text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Soup size={28} className="text-green-500" />
                <span>RecipeApp</span>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase">Navigation</h3>
                <NavItem icon={<Home />} label="Home" onClick={() => onNavigate('home')} />
                {/* NEW Nav Item */}
                <NavItem icon={<CalendarDays />} label="Meal Planner" onClick={() => onNavigate('mealPlanner')} />
                <NavItem icon={<BookMarked />} label="Saved Recipes" onClick={() => onNavigate('savedRecipes')} />
                <NavItem icon={<CookingPot />} label="My Diet" onClick={() => onNavigate('myDiet')} />
                <NavItem icon={<ChefHat />} label="Recipe Generator" onClick={() => onNavigate('recipeGenerator')} />
            </nav>
            {isAdmin && (
                <nav className="px-4 space-y-2">
                    <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase">Admin</h3>
                    <NavItem icon={<AdminUsers />} label="Admin Panel" onClick={() => onNavigate('admin')} />
                </nav>
            )}
            <div className="p-4 mt-auto">
                <ThemeToggle /> 
                <NavItem icon={<LogOut />} label="Logout" onClick={onLogout} />
            </div>
        </div>
    );
};

export default Sidebar;

