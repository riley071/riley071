import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedBeats from "@/components/home/FeaturedBeats";
import GenresSection from "@/components/home/GenresSection";
import HowItWorks from "@/components/home/HowItWorks";
import ProducerCTA from "@/components/home/ProducerCTA";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Nsimabeats - Africa's Premier Beat Marketplace</title>
        <meta 
          name="description" 
          content="Discover premium beats from Africa's finest producers. License exclusive Afrobeats, Amapiano, and more for your next hit track. Join Nsimabeats today." 
        />
        <meta name="keywords" content="beats, Afrobeats, Amapiano, music production, African beats, beat marketplace, buy beats" />
        <link rel="canonical" href="https://nsimabeats.com" />
        <meta property="og:title" content="Nsimabeats - Africa's Premier Beat Marketplace" />
        <meta property="og:description" content="Discover premium beats from Africa's finest producers." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturedBeats />
          <GenresSection />
          <HowItWorks />
          <ProducerCTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
