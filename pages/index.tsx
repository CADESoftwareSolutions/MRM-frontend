import { useEffect, useState } from "react";
import HomePage from "../components/HomePage/HomePage";
import Layout from "../components/Layout/Layout";

const Home = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoaded(true), 50); // small delay to trigger animation
    return () => clearTimeout(timeout);
  }, []);
  return (
    <div
      className={`transition-opacity duration-900 ease-in-out ${
        loaded ? "opacity-100" : "opacity-70"
      }`}
    >
      <Layout>
        <HomePage />
      </Layout>
    </div>
  );
};

export default Home;
