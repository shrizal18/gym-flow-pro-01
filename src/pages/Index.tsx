import Navbar from "@/components/public/Navbar";
import HeroSection from "@/components/public/HeroSection";
import AboutSection from "@/components/public/AboutSection";
import PricingSection from "@/components/public/PricingSection";
import TestimonialsSection from "@/components/public/TestimonialsSection";
import ContactSection from "@/components/public/ContactSection";
import Footer from "@/components/public/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <PricingSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
