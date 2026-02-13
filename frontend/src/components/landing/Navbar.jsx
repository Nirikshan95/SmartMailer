import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="landing-nav">
      <div className="landing-container nav-content">
        <Link to="/" className="nav-logo">
          SmartMailer
        </Link>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it Works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </div>
        <Link to="/app" className="btn btn-primary">
          Start Now
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
