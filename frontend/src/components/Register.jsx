import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '3001';
const API_URL = `http://${API_HOST}:${API_PORT}`;

function Register({ onRegisterSuccess, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Registration failed');
            } else {
                // Success! Notify parent to switch views
                onRegisterSuccess(); 
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
            <h2>Create Account</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <TextField
                    label="Full Name"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                />
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                />
                
                <Button 
                    variant="contained" 
                    color="primary" 
                    type="submit" 
                    disabled={isLoading}
                >
                    {isLoading ? 'Registering...' : 'Register'}
                </Button>
            </form>

            {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

            <p style={{ marginTop: '1rem' }}>
                Already have an account?{' '}
                <Button onClick={onSwitchToLogin} style={{ textTransform: 'none' }}>
                    Log in here
                </Button>
            </p>
        </div>
    );
}

export default Register;