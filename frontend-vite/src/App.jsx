// frontend/src/App.js
import React, { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import TodoList from './components/TodoList.jsx'
import './App.css'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'

const API_URL = import.meta.env.VITE_API_URL;

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
        <div className="body">
            <div className='app-container'>
                <h1 className=''>Full Stack Todo App</h1>
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