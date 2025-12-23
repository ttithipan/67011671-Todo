import { useState, useEffect } from 'react';

// --- Constants ---
// You can move these to a separate config file if preferred
const API_URL = `http://${import.meta.env.VITE_API_HOST || 'localhost'}:${import.meta.env.VITE_API_PORT || '3001'}`;

export const useTodoManager = (onLogout, username) => {
  const [todos, setTodos] = useState([]);
  const [teams, setTeams] = useState([]); 
  
  // Generic helper for API calls to reduce repetition
  const apiCall = async (endpoint, options = {}) => {
    try {
      const res = await fetch(`${API_URL}/api/${endpoint}`, { 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options 
      });

      if (res.status === 401) {
        if (onLogout) onLogout();
        return null;
      }

      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      
      // Return true for DELETE, otherwise return parsed JSON
      return options.method === 'DELETE' ? true : await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Initial Data Fetching
  useEffect(() => {
    const initData = async () => {
      // 1. Get Todos
      const todoData = await apiCall('todos');
      if (todoData) setTodos(todoData);

      // 2. Get Memberships -> Then Get Team Names
      const memberships = await apiCall('teams/listmemberships', { method: 'POST' });
      
      if (memberships && memberships.length > 0) {
        const teamIds = memberships.map(m => m.team_id);
        const teamNames = await apiCall('teams/name', { 
          method: 'POST', 
          body: JSON.stringify({ teamIds }) 
        });
        if (teamNames) setTeams(teamNames);
      }
    };

    initData();
  }, [onLogout]);

  // --- Actions ---

  const addTodo = async (task, teamId) => {
    if (!task.trim()) return;
    
    // Convert "Personal" selection back to API format (usually null or omitted)
    const payloadTeamId = teamId === 'Personal' ? null : teamId;

    const newTodo = await apiCall('todos', {
      method: 'POST',
      body: JSON.stringify({ task, teamId: payloadTeamId })
    });

    if (newTodo) setTodos(prev => [newTodo, ...prev]);
  };

  const updateTodo = async (id, updates) => {
    const res = await apiCall(`todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    if (res) {
      setTodos(prev => prev.map(t => 
        t.id === id 
          ? { ...t, ...updates, updated: new Date().toISOString() } 
          : t
      ));
    }
  };

  const deleteTodo = async (id) => {
    const success = await apiCall(`todos/${id}`, { method: 'DELETE' });
    if (success) setTodos(prev => prev.filter(t => t.id !== id));
  };

  const createTeam = async () => {
    const res = await apiCall('teams', {
      method: 'POST',
      body: JSON.stringify({ name: `Team of ${username}` })
    });
    
    if (res) {
      alert('Team created!');
      // Optimistically add the new team or refetch could go here
      // For now, we assume the user might refresh or we add it to state:
      // setTeams(prev => [...prev, res]); 
    }
  };

  return { 
    todos, 
    teams, 
    addTodo, 
    updateTodo, 
    deleteTodo, 
    createTeam 
  };
};