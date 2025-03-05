import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-md"
        style={{ backgroundImage: "url('/path-to-your-image.jpg')" }}
      ></div>

      {/* Centered Content */}
      <div className="relative z-10 text-center text-black">
        <p className="text-5xl font-bold w-full max-w-4xl leading-tight">
          Welcome to Teamer - Collaborate, Organize, Succeed
        </p>

        {/* Centered Buttons */}
        <div className="mt-8 flex justify-center space-x-6">
          <button 
            onClick={() => navigate("/login")} 
            className="px-8 py-3 bg-black text-white rounded-lg shadow-lg transition hover:opacity-80"
          >
            Login
          </button>
          <button 
            onClick={() => navigate("/signup")} 
            className="px-8 py-3 bg-black text-white rounded-lg shadow-lg transition hover:opacity-80"
          >
            Signup
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
