import loadingGif from '/loading.gif';

const LoadingSpinner = ({ loadingMessage }) => {
  return (
    <div className="flex flex-col items-center my-4">
      <img src={loadingGif} alt="Loading..." className="w-[200px] h-[200px] mb-4 rounded-xl" />
      <button
        disabled
        className="w-full bg-[#1c6d72] text-white font-bold py-2 px-4 rounded opacity-50"
      >
        {loadingMessage}
      </button>
    </div>
  );
};

export default LoadingSpinner; 