import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav className="flex items-center text-xs sm:text-sm text-slate-500 py-3 overflow-x-auto whitespace-nowrap" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1.5 sm:space-x-2">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-teal-700 font-medium transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1 shrink-0" />
              {isLast || !item.to ? (
                <span className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-xs" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="font-medium text-slate-500 hover:text-teal-700 transition-colors truncate max-w-[100px] sm:max-w-xs"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
