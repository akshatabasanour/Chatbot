"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import './page.css';

export default function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!isLogin && password !== confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }
    if (!email || !password || (!isLogin && !name)) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        router.push('/dashboard');
      }
    } catch (error) {
      setErrorMsg(error.message.replace('Firebase: ', '')); // Removes the 'Firebase: ' prefix from standard Firebase errors for cleaner UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="glass-panel login-panel">
        <h1 className="gradient-text">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="subtitle">{isLogin ? 'Sign in to access your dashboard' : 'Fill in your details below'}</p>
        
        {errorMsg && <p style={{color: '#ff4d4d', fontSize: '0.9rem', marginBottom: '-0.5rem', textAlign: 'center'}}>{errorMsg}</p>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input 
              type="text" 
              className="auth-input" 
              placeholder="Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input 
            type="email" 
            className="auth-input" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            className="auth-input" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {!isLogin && (
            <input 
              type="password" 
              className="auth-input" 
              placeholder="Confirm Password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}
          <button type="submit" className="auth-button" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        
        <p className="toggle-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="toggle-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </main>
  );
}
