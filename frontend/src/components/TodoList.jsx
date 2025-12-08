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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Todo List for: {username}</h2>
                <Button variant="contained" onClick={handleLogout}>Logout</Button>
            </div>
            
            <form onSubmit={handleAddTodo} style ={{ display: 'flex', marginBottom: '1rem', height: '3rem', justifyContent: 'space-between'}}>
                <TextField
                    size='small'
                    label="New Task"
                    variant='filled'                    
                    type="text"
                    placeholder="New Task"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                />
                <Button variant = "contained" color = "success" type="submit">Add Task</Button>
            </form>

            <div className="todo-list">
                <h2>Todo</h2>
                {[...todos].sort((a, b) => new Date(b.updated) - new Date(a.updated))
                .filter((todo) => todo.done == '0')
                .map(todo => (
                    <li className={`todo-item ${todo.done ? 'done' : ''}`} key={todo.id}>
                        <p style={{width: '70vw', overflowWrap: 'anywhere'}}>{todo.task}</p> 
                        <p style={{width: '20vw'}}> Updated: {new Date(todo.updated).toLocaleString()}</p>
                        <DateTimePicker 
                            label="Target date.."  // Always shows this at the top
                            value={todo.target_date ? dayjs(todo.target_date) : null} // Shows date inside the box if it exists
                            onChange={(newDate) => handleTargetDateChange(todo.id, newDate)}
                        />
                        <Select onChange={(e) => handleDoneStatus(todo.id, e.target.value)} value={todo.done}>
                            <MenuItem value="0">Todo</MenuItem>
                            <MenuItem value="1">Doing</MenuItem>
                            <MenuItem value="2">Done</MenuItem>
                            <MenuItem value="" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTodo(todo.id)
                                    }}                               
                                sx={{ color: "red" }}>
                                Delete
                            </MenuItem>
                            <MenuItem value="4">

                            </MenuItem>
                        </Select>
                    </li>
                ))}
                <h2>Doing</h2>
                {[...todos].sort((a, b) => new Date(b.updated) - new Date(a.updated))
                .filter((todo) => todo.done == '1')
                .map(todo => (
                    <li className={`todo-item ${todo.done ? 'done' : ''}`} key={todo.id}>
                        <p style={{width: '70vw', overflowWrap: 'anywhere'}}>{todo.task}</p> 
                        <p style={{width: '20vw'}}> Updated: {new Date(todo.updated).toLocaleString()}</p>
                        <DateTimePicker 
                            label="Target date.."  // Always shows this at the top
                            value={todo.target_date ? dayjs(todo.target_date) : null} // Shows date inside the box if it exists
                            onChange={(newDate) => handleTargetDateChange(todo.id, newDate)}
                        />
                        <Select onChange={(e) => handleDoneStatus(todo.id, e.target.value)} value={todo.done}>
                            <MenuItem value="0">Todo</MenuItem>
                            <MenuItem value="1">Doing</MenuItem>
                            <MenuItem value="2">Done</MenuItem>
                            <MenuItem value="" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTodo(todo.id)
                                    }}                               
                                sx={{ color: "red" }}>
                                Delete
                            </MenuItem>
                            <MenuItem value="4">

                            </MenuItem>
                        </Select>
                    </li>
                ))}
                <h2>Done</h2>
                {[...todos].sort((a, b) => new Date(b.updated) - new Date(a.updated))
                .filter((todo) => todo.done == '2')
                .map(todo => (
                    <li className={`todo-item ${todo.done ? 'done' : ''}`} key={todo.id}>
                        <p style={{width: '70vw', overflowWrap: 'anywhere'}}>{todo.task}</p> 
                        <p style={{width: '20vw'}}> Updated: {new Date(todo.updated).toLocaleString()}</p>
                        <DateTimePicker 
                            label="Target date.."  // Always shows this at the top
                            value={todo.target_date ? dayjs(todo.target_date) : null} // Shows date inside the box if it exists
                            onChange={(newDate) => handleTargetDateChange(todo.id, newDate)}
                        />
                        <Select onChange={(e) => handleDoneStatus(todo.id, e.target.value)} value={todo.done}>
                            <MenuItem value="0">Todo</MenuItem>
                            <MenuItem value="1">Doing</MenuItem>
                            <MenuItem value="2">Done</MenuItem>
                            <MenuItem value="" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTodo(todo.id)
                                    }}                               
                                sx={{ color: "red" }}>
                                Delete
                            </MenuItem>
                            <MenuItem value="4">

                            </MenuItem>
                        </Select>
                    </li>
                ))}
            </div>
        </div>
    )
}

export default TodoList