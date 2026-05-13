import { useNavigate } from "react-router-dom";

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Welcome to the future of Sports Technology
      </h2>
      <button
        onClick={() => navigate("/login")}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
      >
        LOG IN
      </button>
    </div>
  );
}

export default Welcome;
