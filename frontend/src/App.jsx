import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import DashboardLayout from "./Dashboard/DashboardLayout"; // Import dashboard

function App() {
  return (
    <Router> {/* Wrap Routes inside Router */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<DashboardLayout />} /> {/* Add dashboard route */}
      </Routes>
    </Router>
  );
}

export default App;
