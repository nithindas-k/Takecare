import React from 'react';

interface SearchInputProps {
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ placeholder }) => (
  <div className="relative flex justify-center mt-8 mb-8">
    <input
      type="text"
      className="w-full md:w-1/2 px-5 py-3 border rounded-full shadow focus:outline-none focus:border-teal-400"
      placeholder={placeholder}
    />
    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-teal-600">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2"></line>
      </svg>
    </span>
  </div>
);

export default SearchInput;
