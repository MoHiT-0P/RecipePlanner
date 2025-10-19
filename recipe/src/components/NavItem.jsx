import React from 'react';

const NavItem = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-600 dark:text-gray-300 rounded-lg hover:bg-green-50 dark:hover:bg-gray-700/50 hover:text-green-700 dark:hover:text-green-400 transition">
    {React.cloneElement(icon, { size: 20 })}
    <span className="font-medium">{label}</span>
  </button>
);

export default NavItem;

