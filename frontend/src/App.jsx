import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import TodoList from './components/TodoList.jsx';
import './App.css';

const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '3001';
const API_URL = `http://${API_HOST}:${API_PORT}`;

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Loading state for initial check
    const [view, setView] = useState('login'); // 'login' or 'register'

    // 1. SESSION CHECK (The Auth Bridge)
    // Run this once when the app loads to see if we are already logged in
    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    credentials: 'include' // CRITICAL: Sends the cookie
                });
                
                if (response.ok) {
                    const user = await response.json();
                    setCurrentUser(user);
                }
            } catch (err) {
                console.log("Not logged in or server down");
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const handleLogin = (user) => {
        setCurrentUser(user);
    };

    const handleLogout = async () => {
        try {
            // Tell server to destroy session
            await fetch(`${API_URL}/api/auth/logout`, { credentials: 'include' });
            setCurrentUser(null);
            setView('login');
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    const handleRegisterSuccess = () => {
        alert("Account created successfully! Please log in.");
        setView('login');
    };

    const getGreetingName = () => {
        if (!currentUser) return '';
        return currentUser.username || currentUser.email;
    };

    // Show a loading spinner while checking session
    if (isLoading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading...</div>;

return (
        <div>
            <div className='app-container'>
                <div className='top-bar'>
                    <img className='logo' src="/cei.png" alt="cei logo" style={{ maxHeight: "5rem", maxWidth: "5rem" }} />
                    <h1 className='title'>Full Stack Todo App</h1>
                    
                    {/* NEW: Hello Message in Main Container */}
                    {currentUser && (
                        <span style={{ marginLeft: 'auto', marginRight: '20px', fontWeight: 'bold' }}>
                            Hello, {getGreetingName()}
                        </span>
                    )}
                </div>

                {currentUser ? (
                    /* The snippet you requested */
                    <TodoList 
                        username={currentUser.username} 
                        email={currentUser.email} 
                        userId={currentUser.id} 
                        onLogout={handleLogout} 
                    />
                ) : (
                    /* ... Login/Register view ... */
                    <div className="auth-container">
                        {/* ... (Same as before) ... */}
                        {view === 'login' ? (
                            <>
                                <Login onLogin={handleLogin} />
                                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                                    Don't have an account?{' '}
                                    <button onClick={() => setView('register')} style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}>
                                        Register
                                    </button>
                                </p>
                            </>
                        ) : (
                            <Register onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setView('login')} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;