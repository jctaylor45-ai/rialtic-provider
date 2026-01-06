import React from 'react';

export const Select = ({ value, onChange, options, className = '', ...props }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${className}`}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
