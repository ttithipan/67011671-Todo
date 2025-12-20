// frontend/src/components/TodoList.js
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import '../App.css'
import React, { useState, useEffect } from 'react'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import MenuItem from '@mui/material/MenuItem';


const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '5001';
const API_URL = `http://${API_HOST}:${API_PORT}`;

function TodoList({ username, onLogout }) {
    const [todos, setTodos] = useState([])
    const [newTask, setNewTask] = useState('')

    // 1. READ: Fetch all todos for the current user
    // Moved inside useEffect to fix dependency error
    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const response = await fetch(`${API_URL}/api/todos/${username}`)
                
                if (!response.ok) {
                    console.error('Failed to fetch todos:', response.statusText)
                    return
                }
    
                const data = await response.json()
                console.log('Fetched todos:', data)
                setTodos(data)
            } catch (err) {
                console.error('Error fetching todos:', err)
            }
        }

        fetchTodos()
    }, [username]) 

    // 2. CREATE: Add a new todo
    const handleAddTodo = async (e) => {
        e.preventDefault()
        if (!newTask.trim()) return

        try {
            const response = await fetch(`${API_URL}/api/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, task: newTask }),
            })

            if (!response.ok) {
                console.error('Failed to add todo:', response.statusText)
                return
            }

            const newTodo = await response.json()
            setTodos([newTodo, ...todos]) 
            setNewTask('')
        } catch (err) {
            console.error('Error adding todo:', err)
        }
    }

    // 3. UPDATE: Toggle the 'done' status
    const handleDoneStatus = async (id, newDoneStatus) => {
        try {
            const response = await fetch(`${API_URL}/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done: newDoneStatus }),
            })

            if (!response.ok) {
                console.error('Failed to update todo:', response.statusText)
                return
            }

            setTodos(todos.map(todo => 
                todo.id === id ? { ...todo, done: newDoneStatus, updated: new Date().toISOString()} : todo
            ))
        } catch (err) {
            console.error('Error toggling done status:', err)
        }
    }

    const handleTargetDateChange = async (id, newDate) => {
        try {
            const response = await fetch(`${API_URL}/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_date: newDate }),
            })

            if (!response.ok) {
                console.error('Failed to update target date:', response.statusText)
                return
            }
            setTodos(todos.map(todo => 
                todo.id === id ? { ...todo, target_date: newDate, updated: new Date().toISOString()} : todo
            ))
        } catch (err) {
            console.error('Error updating target date:', err)
        }
    }

    // 5. DELETE: Remove a todo item
    const handleDeleteTodo = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/todos/${id}`, {
                method: 'DELETE',
            })
            
            if (!response.ok) {
                 console.error('Failed to delete todo:', response.statusText)
                return
            }

            setTodos(todos.filter(todo => todo.id !== id))
        } catch (err) {
            console.error('Error deleting todo:', err)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('todo_username')
        onLogout()
    }

return (
        <div className="todo-container">
            <div className="todo-header">
                <h2>Todo List for: {username}</h2>
                <Button variant="contained" onClick={handleLogout}>Logout</Button>
            </div>
            
            <form onSubmit={handleAddTodo} className="todo-form">
                <TextField
                    size='small'
                    label="New Task"
                    variant='filled'                    
                    type="text"
                    placeholder="New Task"
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
                                .filter((todo) => todo.done == statusId)
                                .map(todo => (
                                    <li className={`todo-item ${todo.done === '2' ? 'done' : ''}`} key={todo.id}>
                                        
                                        {/* 1. Task Description */}
                                        <div className="todo-text">
                                            <span className="task-name">{todo.task}</span>
                                            <span className="task-date">Updated: {new Date(todo.updated).toLocaleString()}</span>
                                        </div>

                                        {/* 2. Controls (Date + Select) */}
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
                                                onChange={(e) => handleDoneStatus(todo.id, e.target.value)} 
                                                value={todo.done}
                                            >
                                                <MenuItem value="0">Todo</MenuItem>
                                                <MenuItem value="1">Doing</MenuItem>
                                                <MenuItem value="2">Done</MenuItem>
                                                <MenuItem value="" onClick={(e) => { e.stopPropagation(); handleDeleteTodo(todo.id) }} sx={{ color: "red" }}>
                                                    Delete
                                                </MenuItem>
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
    )
}

export default TodoList