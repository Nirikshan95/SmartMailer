import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Workflow from '../components/landing/Workflow';
import Features from '../components/landing/Features';
import UseCases from '../components/landing/UseCases';
import Demo from '../components/landing/Demo';
import Pricing from '../components/landing/Pricing';
import Security from '../components/landing/Security';
import Testimonials from '../components/landing/Testimonials';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';
import '../components/landing/landing.css';

const LandingPage = () => {
    return (
        <div className="landing-page">
            <Navbar />
            <main>
                <Hero />
                <Workflow />
                <Features />
                <UseCases />
                <Demo />
                <Pricing />
                <Security />
                <Testimonials />
                <FAQ />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
