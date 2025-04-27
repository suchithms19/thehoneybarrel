const SearchResults = ({ matches, spiritData }) => {
  const calculateSavings = (scrapedPrice, baxusPrice) => {
    const scraped = parseFloat(scrapedPrice.replace(/[^0-9.]/g, ''));
    const baxus = parseFloat(baxusPrice);
    if (isNaN(scraped) || isNaN(baxus)) return null;
    return scraped - baxus;
  };

  return (
    <div className="mt-4 space-y-4">
      {matches.map((match, index) => {
        const savings = calculateSavings(spiritData.price, match.price);
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden p-4">
            <div className="flex items-start space-x-4">
              <div className="w-1/3">
                <img 
                  src={match.imageUrl} 
                  alt={match.name}
                  className="w-full h-[140px] object-contain bg-white"
                />
              </div>
              <div className="w-2/3">
                <h3 className="font-['DM_Serif_Text'] text-[15px] text-gray-800">{match.name}</h3>
                <div className="text-[10px] text-gray-600 mb-1">
                  {match.spiritType} | {match.attributes?.Size}{match.attributes?.ABV && ` | ${match.attributes?.ABV * 2} Proof`}
                </div>
                <div className="font-['DM_Sans']">
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold text-gray-900">${match.price}</p>
                    {savings > 0 && (
                      <span className="text-md text-green-600">Save ${savings.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="mt-3">
                    <a 
                      href={`https://baxus.co/asset/${match.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-[#1c6d72] hover:bg-[#165256] text-white text-center font-bold py-2 px-4 rounded text-sm"
                    >
                      Buy Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SearchResults; 