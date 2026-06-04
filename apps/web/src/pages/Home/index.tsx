import sakLogo from '@/assets/logos/dsa.png';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center py-20 px-2 gap-10">
      <img className="w-full max-w-100" src={sakLogo} />
    </div>
  );
};

export default HomePage;
