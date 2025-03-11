import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData.name, formData.email, formData.password, formData.phone);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Name" onChange={handleChange} required className="input" />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="input" />
          <input name="phone" type="text" placeholder="Phone" onChange={handleChange} required className="input" />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required className="input" />
          <button type="submit" className="btn">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
