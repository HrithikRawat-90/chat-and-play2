import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ search, setSearch }) => {
  return (
    <div className="px-3.5 py-2.5">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-purple-400/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search or start new chat"
          className="w-full pl-10 pr-8 py-2 bg-[#0c0919] border border-purple-900/40 rounded-xl text-white placeholder-purple-300/35 text-xs sm:text-sm focus:outline-none focus:border-purple-500/70 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 p-1 text-purple-400/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;

