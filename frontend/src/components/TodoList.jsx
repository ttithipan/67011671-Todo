import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import '../App.css';

const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '3001';
const API_URL = `http://${API_HOST}:${API_PORT}`;

function TodoList({ username, email, userId, onLogout }) {
    const [todos, setTodos] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const response = await fetch(`${API_URL}/api/todos`, {
                    credentials: 'include' 
                });
                
                if (!response.ok) {
                    if (response.status === 401) onLogout();
                    return;
                }
    
                const data = await response.json();
                setTodos(data);
            } catch (err) {
                console.error('Error fetching todos:', err);
            }
        };

        fetchTodos();
    }, [onLogout]);

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            const response = await fetch(`${API_URL}/api/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ task: newTask }), 
            });

            if (!response.ok) return;

            const newTodo = await response.json();
            setTodos([newTodo, ...todos]);
            setNewTask('');
        } catch (err) {
            console.error('Error adding todo:', err);
        }
    };

    const handleDoneStatus = async (id, newDoneStatus) => {
        if (newDoneStatus === "DELETE") {
            handleDeleteTodo(id);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ done: newDoneStatus }),
            });

            if (!response.ok) return;

            setTodos(todos.map(todo => 
                todo.id === id 
                ? { ...todo, done: newDoneStatus, updated: new Date().toISOString() } 
                : todo
            ));
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleTargetDateChange = async (id, newDate) => {
        try {
            const response = await fetch(`${API_URL}/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ target_date: newDate }),
            });

            if (!response.ok) return;

            setTodos(todos.map(todo => 
                todo.id === id 
                ? { ...todo, target_date: newDate, updated: new Date().toISOString() } 
                : todo
            ));
        } catch (err) {
            console.error('Error updating date:', err);
        }
    };

    const handleDeleteTodo = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/todos/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            
            if (!response.ok) return;

            setTodos(todos.filter(todo => todo.id !== id));
        } catch (err) {
            console.error('Error deleting todo:', err);
        }
    };

    // Determine display name (prefer username, fallback to "User" or email if needed)

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="todo-container">
                <div className="todo-header">
                    <h2>Todo List</h2>
                    <Button variant="contained" onClick={onLogout}>Logout</Button>
                </div>
                
                <form onSubmit={handleAddTodo} className="todo-form">
                    <TextField
                        size='small'
                        label="New Task"
                        variant='filled'                    
                        type="text"
                        className="todo-input"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                    />
                    <Button variant="contained" color="success" type="submit">Add</Button>
                </form>

                <div className="todo-list">
                    {['0', '1', '2'].map(statusId => {
                        const statusTitle = statusId === '0' ? 'Todo' : statusId === '1' ? 'Doing' : 'Done';
                        return (
                            <div key={statusId} className="status-section">
                                <h3>{statusTitle}</h3>
                                {[...todos]
                                    .sort((a, b) => new Date(b.updated) - new Date(a.updated))
                                    .filter((todo) => String(todo.done) === statusId)
                                    .map(todo => (
                                        <li className={`todo-item ${String(todo.done) === '2' ? 'done' : ''}`} key={todo.id}>
                                            <div className="todo-text">
                                                <span className="task-name">{todo.task}</span>
                                                <span className="task-date">
                                                    Target: {todo.target_date ? new Date(todo.target_date).toLocaleDateString() : 'None'}
                                                </span>
                                            </div>

                                            <div className="todo-controls">
                                                <DateTimePicker 
                                                    label="Target date" 
                                                    className="date-picker"
                                                    slotProps={{ textField: { size: 'small' } }} 
                                                    value={todo.target_date ? dayjs(todo.target_date) : null}
                                                    onChange={(newDate) => handleTargetDateChange(todo.id, newDate)}
                                                />
                                                <Select 
                                                    className="status-select"
                                                    size="small"
                                                    value={String(todo.done)}
                                                    onChange={(e) => handleDoneStatus(todo.id, e.target.value)}
                                                >
                                                    <MenuItem value="0">Todo</MenuItem>
                                                    <MenuItem value="1">Doing</MenuItem>
                                                    <MenuItem value="2">Done</MenuItem>
                                                    <MenuItem value="DELETE" sx={{ color: "red" }}>Delete</MenuItem>
                                                </Select>
                                            </div>
                                        </li>
                                    ))
                                }
                            </div>
                        )
                    })}
                </div>
            </div>
        </LocalizationProvider>
    );
}

export default TodoList;