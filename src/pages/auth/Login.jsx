import { useState } from "react";
import { login } from "../../api/authApi";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    try {
      const res = await login({ username, password });
      Cookies.set("account", JSON.stringify(res.data));

      if (res.status === 200) {
        toast.success("Login successful!");
        setTimeout(() => {
          navigate("/home");
        }, 1000);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Login failed! Check your credentials.",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-red-600">
          Login
        </h2>

        <input
          placeholder="Arid No / Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
        >
          LOG IN
        </button>

        <ToastContainer position="top-center" autoClose={2000} />
      </div>
    </div>
  );
}

export default Login;
