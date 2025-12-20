// frontend/src/App.js
import React, { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import TodoList from './components/TodoList.jsx'
import './App.css'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'

const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '5001';
const API_URL = `http://${API_HOST}:${API_PORT}`;

function App() {
    const [currentUser, setCurrentUser] = useState(null)
    

    // Check for stored username on initial load
    useEffect(() => {
        const storedUser = localStorage.getItem('todo_username')
        if (storedUser) {
            setCurrentUser(storedUser)
        }
    }, []);

    const handleLogin = (username) => {
        setCurrentUser(username)
    };

    const handleLogout = () => {
        // Clear username from local storage and state
        localStorage.removeItem('todo_username')
        setCurrentUser(null)
    };

    return (
        <div >
            <div className='app-container'>
                <div className='top-bar'>
                    <img className='logo' src="/cei.png" alt="cei logo" style={{maxHeight:"5rem", maxWidth: "5rem"}}/>
                    <h1 className='title'>Full Stack Todo App</h1>
                </div>
                {/* Conditional rendering based on login status */}
                {currentUser ? (
                    <TodoList username={currentUser} onLogout={handleLogout} />
                ) : (
                    <Login onLogin={handleLogin} />
                )}
            </div>
        </div>
    )
}

export default App