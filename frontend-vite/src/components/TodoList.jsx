// frontend/src/components/TodoList.js
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import React, { useState, useEffect } from 'react'


const API_URL = import.meta.env.VITE_API_URL;

function TodoList({ username, onLogout }) {
    const [todos, setTodos] = useState([])
    const [newTask, setNewTask] = useState('')

    // 1. READ: Fetch all todos for the current user
    // Moved inside useEffect to fix dependency error
    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const response = await fetch(`${API_URL}/todos/${username}`)
                
                if (!response.ok) {
                    console.error('Failed to fetch todos:', response.statusText)
                    return
                }
    
                const data = await response.json()
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
            const response = await fetch(`${API_URL}/todos`, {
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
    const handleToggleDone = async (id, currentDoneStatus) => {
        const newDoneStatus = !currentDoneStatus
        try {
            const response = await fetch(`${API_URL}/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done: newDoneStatus }),
            })

            if (!response.ok) {
                console.error('Failed to update todo:', response.statusText)
                return
            }

            setTodos(todos.map(todo => 
                todo.id === id ? { ...todo, done: newDoneStatus } : todo
            ))
        } catch (err) {
            console.error('Error toggling done status:', err)
        }
    }

    // 4. DELETE: Remove a todo item
    const handleDeleteTodo = async (id) => {
        try {
            const response = await fetch(`${API_URL}/todos/${id}`, {
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
                {todos.map(todo => (
                    <li className={`todo-item ${todo.done ? 'done' : ''}`} key={todo.id}>
                        <Checkbox
                            checked={!!todo.done}
                            onChange={() => handleToggleDone(todo.id, todo.done)}

                        />
                        <p style={{width: '70vw', overflowWrap: 'anywhere'}}>{todo.task}</p> 
                        <p style={{width: '20vw'}}> Updated: {new Date(todo.updated).toLocaleString()}</p>
                        <Button variant="contained" color = "error" onClick={() => handleDeleteTodo(todo.id)}>Delete</Button>
                    </li>
                ))}
            </div>
        </div>
    )
}

export default TodoList