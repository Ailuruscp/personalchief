import { useState } from 'react';

   type SearchBarProps = {
     onSearch: (searchTerm: string) => void;
   };

   export default function SearchBar({ onSearch }: SearchBarProps) {
     const [searchTerm, setSearchTerm] = useState('');

     const handleSearch = () => {
       onSearch(searchTerm);
     };

     return (
       <div className="max-w-md mx-auto">
         <input
           type="text"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="w-full p-2 border rounded mb-4"
           placeholder="Search for a recipe"
         />
         <button
           onClick={handleSearch}
           className="w-full bg-blue-600 text-white py-2 rounded"
         >
           Search
         </button>
       </div>
     );
   }