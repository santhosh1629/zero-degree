import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DynamicBackground from '../components/student/DynamicBackground';

declare const gsap: any;

const RegisterStudentPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof gsap === 'undefined') return;
    gsap.from(cardRef.current, { duration: 0.8, opacity: 0, scale: 0.9, y: 50, ease: 'power3.out', delay: 0.2 });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    if (!/^\d{10}$/.test(phone)) {
        setError("Please enter a valid 10-digit phone number.");
        return;
    }
    if (!agreedToTerms) {
        setError("You must agree to the Terms & Conditions to create an account.");
        return;
    }

    setLoading(true);
    try {
      await register(name, phone, password);
      navigate('/student/welcome');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-student-bg-dark p-4 overflow-hidden">
        <DynamicBackground />
        <div className="absolute inset-0 bg-black/70 z-0"></div>
      
      {/* Registration Card */}
      <div ref={cardRef} className="relative max-w-md w-full bg-student-card backdrop-blur-xl border border-student-card-border rounded-2xl shadow-2xl p-8 z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-student-text-primary font-heading">Create Account</h1>
          <p className="text-student-text-secondary/80 mt-2">Join Zero✦Degree!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-student-text-secondary font-semibold mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border-b-2 border-white/20 text-student-text-primary rounded-lg focus:outline-none focus:border-student-accent transition-all placeholder:text-white/40 focus:shadow-[0_0_15px_rgba(252,163,17,0.6)]"
              placeholder="e.g., Arjun Kumar"
              required
            />
          </div>
          <div>
            <label className="block text-student-text-secondary font-semibold mb-2" htmlFor="phone">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border-b-2 border-white/20 text-student-text-primary rounded-lg focus:outline-none focus:border-student-accent transition-all placeholder:text-white/40 focus:shadow-[0_0_15px_rgba(252,163,17,0.6)]"
              placeholder="e.g., 9876543210"
              required
            />
          </div>
          <div>
            <label className="block text-student-text-secondary font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border-b-2 border-white/20 text-student-text-primary rounded-lg focus:outline-none focus:border-student-accent transition-all placeholder:text-white/40 focus:shadow-[0_0_15px_rgba(252,163,17,0.6)]"
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
              <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 rounded bg-white/10 border-white/30 text-student-accent focus:ring-student-accent"
              />
              <label htmlFor="terms" className="text-xs text-student-text-secondary">
                  I have read and agree to the{' '}
                  <Link to="/terms?for=student" className="font-bold text-student-accent hover:underline">
                      Zero✦Degree Terms & Conditions (Customer).
                  </Link>
              </label>
          </div>
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="btn-3d w-full bg-student-accent border-student-accent-dark text-student-bg-dark font-black font-heading py-3 px-4 rounded-lg shadow-lg transition-transform hover:-translate-y-1 hover:shadow-student-accent/40 hover:shadow-2xl disabled:bg-student-accent/50 disabled:border-student-accent-dark/50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="text-center mt-6">
            <Link to="/login-student" className="text-sm text-student-accent/80 hover:text-student-accent font-medium transition-colors">Already have an account? Login</Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default RegisterStudentPage;