const NoResults = () => {
  return (
    <div className="mt-4 p-4 bg-white rounded shadow-sm text-center">
      <p className="text-gray-800 font-['DM_Serif_Text'] text-lg mb-3">No matches found, no worries!</p>
      <p className="text-gray-600 mb-4">Discover our curated collection of the world's fine and rare spirits.</p>
      <a 
        href="https://baxus.co"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-[#1c6d72] hover:bg-[#165256] text-white text-center font-bold py-2 px-4 rounded text-sm"
      >
        Explore Baxus Collection
      </a>
    </div>
  );
};

export default NoResults; 