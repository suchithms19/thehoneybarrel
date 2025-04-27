import logo from '/logo.svg';

const Header = ({ showDescription }) => {
  return (
    <div className="flex flex-col items-center mb-6">
      <img src={logo} alt="Baxus Logo" className="h-4" />
      {showDescription && (
        <p className="font-['DM_Sans'] text-sm mt-4 text-gray-600 text-center tracking-wide">
          The only peer-to-peer marketplace for fine & rare spirits
        </p>
      )}
    </div>
  );
};

export default Header; 