
"use client"
import { Search, X } from 'lucide-react'
import React, {useState} from 'react'

const SearchBar = () => {
      const [search, setSearch] = useState("");
const [searchResults, setSearchResults] = useState([]);
  return (
    <div className="w-full bg-gradient-to-r from-gray-500 to-gray-300 py-16">
      <div className="container mx-auto max-w-3xl	">
        <form className="relative">
          <input
            type="text"
            placeholder="Search for courses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full flex-1 rounded-md py-5 border border-darkColor/20 px-5 shadow-lg"
          />
          {search && (
            <X
              onClick={() => setSearch("")}
              className="w-5 h-5 absolute right-11 top-6 hover:text-red-600 hoverEffect"
            />
          )}
          <button
            type="submit"
            className="absolute right-0 top-0 h-full w-10 bg-black flex items-center justify-center 
            rounded-tr-md rounded-br-md text-white hover:bg-gray-500 hover:text-white transition-all ease-in-out duration-300"
          >
            <Search className="w-5 h-5 " />
          </button>
        </form>
      </div>
    </div>
  );
}

export default SearchBar