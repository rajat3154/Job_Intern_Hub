// Home.jsx
import React, { useEffect, useState } from "react";
import Navbar from "./shared/Navbar";
import HeroSection from "./HeroSection";
import CategoryCarousel from "./CategoryCarousel";
import LatestJobs from "./LatestJobs";
import LatestInternships from "./LatestInternships";
import Footer from "./Footer";

const Home = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="bg-black text-white">
      <Navbar />
      <HeroSection query={query} setQuery={setQuery} />
      <CategoryCarousel setQuery={setQuery} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8">
          <div>
            <LatestJobs query={query} />
            <LatestInternships query={query} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
