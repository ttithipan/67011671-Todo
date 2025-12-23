import React, { useState, useMemo } from 'react';
// UI Imports
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

// Import your custom hook
// Ensure this path matches where you saved the hook file!
import { useTodoManager } from '../hooks/useTodoManager';

// --- Constants ---
const STATUS_CONFIG = [
  { id: '0', title: 'Todo' },
  { id: '1', title: 'Doing' },
  { id: '2', title: 'Done' }
];

// --- Sub-Components (Keep these in the same file for simplicity) ---

const TodoItem = ({ todo, onUpdate, onDelete }) => {
  const isDone = String(todo.done) === '2';
  
  const handleStatusChange = (e) => {
    const val = e.target.value;
    val === "DELETE" ? onDelete(todo.id) : onUpdate(todo.id, { done: val });
  };

  return (
    <li className={`todo-item ${isDone ? 'done' : ''}`} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="todo-text">
        <div className="task-name" style={{ fontWeight: 'bold' }}>{todo.task}</div>
        <div className="task-date" style={{ fontSize: '0.8em', color: '#666' }}>
          Target: {todo.target_date ? new Date(todo.target_date).toLocaleDateString() : 'None'}
        </div>
      </div>

      <div className="todo-controls" style={{ display: 'flex', gap: '8px' }}>
        <DateTimePicker 
          label="Target" 
          slotProps={{ textField: { size: 'small' } }} 
          value={todo.target_date ? dayjs(todo.target_date) : null}
          onChange={(date) => onUpdate(todo.id, { target_date: date })}
        />
        <Select 
          size="small" 
          value={String(todo.done)} 
          onChange={handleStatusChange}
        >
          {STATUS_CONFIG.map(s => <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>)}
          <MenuItem value="DELETE" sx={{ color: "red" }}>Delete</MenuItem>
        </Select>
      </div>
    </li>
  );
};

const StatusColumn = ({ title, todos, onUpdate, onDelete }) => (
  <div className="status-section" style={{ flex: 1, padding: '0 10px' }}>
    <h4 style={{ borderBottom: '2px solid #ddd', paddingBottom: '5px' }}>{title}</h4>
    <ul className="todo-list-ul" style={{ listStyle: 'none', padding: 0 }}>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </ul>
  </div>
);

const TeamRow = ({ teamName, teamId, todos, onUpdate, onDelete }) => {
  const teamTodos = useMemo(() => {
    return todos
      .filter(t => teamId ? t.team_id === teamId : !t.team_id)
      .sort((a, b) => new Date(b.updated) - new Date(a.updated));
  }, [todos, teamId]);

  if (teamTodos.length === 0 && teamId) return null;

  return (
    <div className="team-section" style={{ marginTop: '20px' }}>
      <h2 className="team-title" style={{ backgroundColor: '#f5f5f5', padding: '10px' }}>
        {teamName}
      </h2>
      <div className="todo-kanban-board" style={{ display: 'flex', flexDirection: 'row' }}>
        {STATUS_CONFIG.map(status => (
          <StatusColumn 
            key={status.id}
            title={status.title}
            todos={teamTodos.filter(t => String(t.done) === status.id)}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---
function TodoList({ username, email, userId, onLogout }) {
  // 1. Initialize the Hook
  const { todos, teams, addTodo, updateTodo, deleteTodo, createTeam } = useTodoManager(onLogout, username || email);
  
  // 2. Local State
  const [newTask, setNewTask] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('Personal');

  const handleSubmit = (e) => {
    e.preventDefault();
    addTodo(newTask, selectedTeam);
    setNewTask('');
  };

  const allSections = [
    { id: null, name: 'Personal Todos' },
    ...teams
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="todo-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        
        <div className="todo-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>Task Dashboard</h2>
          <div className='todo-button-group' style={{ gap: '10px', display: 'flex' }}>
            <Button variant='outlined' onClick={createTeam}>Add Team</Button>
            <Button variant="contained" color="error" onClick={onLogout}>Logout</Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="todo-form" style={{ display: 'flex', gap: '10px', marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <TextField
            fullWidth
            size='small'
            label="What needs to be done?"
            variant='outlined'
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <Select 
            size="small"
            value={selectedTeam} 
            onChange={(e) => setSelectedTeam(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <MenuItem value="Personal">Personal</MenuItem>
            {teams.map(team => (
              <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
            ))}
          </Select>
          <Button variant="contained" color="primary" type="submit" disabled={!newTask}>Add Task</Button>
        </form>

        <div className="all-teams-container">
          {allSections.map(section => (
            <TeamRow 
              key={section.id || 'personal'}
              teamName={section.name}
              teamId={section.id}
              todos={todos}
              onUpdate={updateTodo}
              onDelete={deleteTodo}
            />
          ))}
        </div>

      </div>
    </LocalizationProvider>
  );
}

export default TodoList;