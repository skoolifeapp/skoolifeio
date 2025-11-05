import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has seen the welcome page
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    
    if (!hasSeenWelcome) {
      navigate('/welcome');
    }
  }, [navigate]);

  return <Dashboard />;
};

export default Index;
