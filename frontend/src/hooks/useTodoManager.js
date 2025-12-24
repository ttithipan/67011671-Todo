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
        method: options.method,
        body: JSON.stringify(options.body),
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

  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch team memberships
        const memberships = await apiCall('teams/listmemberships', { method: 'POST' });
        
        if (!memberships || memberships.length === 0) {
          setTodos([]);
          return;
        }

        // Extract team IDs from memberships
        const teamIds = memberships.map(m => m.team_id);

        // Fetch team names using the extracted team IDs
        const teamNames = await apiCall('teams/name', { 
          method: 'POST', 
          body: {teamIds: teamIds} 
        });

        if (teamNames) {
          setTeams(teamNames);
        }

        // Fetch todos based on the memberships
        const todoData = await apiCall('todos/list', {
          method: 'POST',
          body: {teamIds: teamIds}
        });

        if (todoData && todoData.data) {
          setTodos(todoData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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
      body: {
        task: task,
        teamId: teamId
      }
    });

    if (newTodo) setTodos(prev => [newTodo, ...prev]);
  };

  const updateTodo = async (id, updates) => {
    const res = await apiCall(`todos/${id}`, {
      method: 'PUT',
      body: updates
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
      body: { name: `Team of ${username}` }
    });
    
    if (res) {
      alert('Team created!');
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