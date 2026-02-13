import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="landing-container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <Link to="/" className="nav-logo footer-logo">
                            SmartMailer
                        </Link>
                        <p className="footer-description">
                            The easiest way to send personalized bulk emails directly from your Gmail.
                            Secure, fast, and free.
                        </p>
                        <div className="social-links" style={{ marginTop: '1.5rem' }}>
                            <a href="#"><Twitter size={18} /></a>
                            <a href="#"><Github size={18} /></a>
                            <a href="#"><Linkedin size={18} /></a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4>Product</h4>
                        <ul className="footer-links">
                            <li><a href="#features">Features</a></li>
                            <li><a href="#pricing">Pricing</a></li>
                            <li><a href="#faq">FAQ</a></li>
                            <li><a href="http://localhost:3001/auth/google">Start Sending</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Legal</h4>
                        <ul className="footer-links">
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                            <li><a href="#">Security</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Stay Updated</h4>
                        <p className="footer-description" style={{ marginBottom: '1rem' }}>
                            Subscribe to our newsletter for updates and tips.
                        </p>
                        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <input type="email" placeholder="Enter your email" className="newsletter-input" />
                            <button type="submit" className="newsletter-btn">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} SmartMailer. All rights reserved.</p>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
                        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
