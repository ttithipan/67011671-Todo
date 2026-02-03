import { useState, useEffect } from 'react';

// --- Constants ---
const API_URL = `http://${import.meta.env.VITE_API_HOST || 'localhost'}:${import.meta.env.VITE_API_PORT || '3001'}`;

export const useTodoManager = (onLogout, nameOfUser) => {
  const [teamRoles, setTeamRoles] = useState([]);
  const [todos, setTodos] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [teamMembersMap, setTeamMembersMap] = useState({});
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

      if (res.status === 403) {
        alert("Forbidden");
        window.location.reload();
        return null;
      }

      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }
        return options.method === 'DELETE' ? true : await res.json();
      } catch (err) {
        console.error(err);
        return null;
      }
    };

  // Centralized data fetching function
  const refreshData = async () => {
    try {
      const usersList = await apiCall('users/list', { method: 'GET' }); // Or 'POST' depending on your backend
      if (usersList) {
        setAllUsers(usersList[0]);
      }

      const memberships = await apiCall('teams/listmemberships', { method: 'POST' });
      
      if (!memberships || memberships.length === 0) {
        setTodos([]);
        setTeams([]); 
        return;
      }
      const rolesMap = {};
      memberships.forEach(m => {rolesMap[m.team_id] = m.role;});
      setTeamRoles(rolesMap);
      
      const teamIds = memberships.map(m => m.team_id);
      const membersData = await apiCall('teams/listteammember', {
      method: 'POST',
      body: { teamIds } 
      });
      if (membersData) {
      const mapping = {};
      // Flatten the nested arrays: [[{team_id: 1...}], [{team_id: 2...}]]
      membersData.forEach(teamArray => {
        if (teamArray.length > 0) {
          const tId = teamArray[0].team_id;
          mapping[tId] = teamArray;
        }
      });
      setTeamMembersMap(mapping);
      }
      const teamNames = await apiCall('teams/name', { 
        method: 'POST', 
        body: { teamIds: teamIds } 
      });
      if (teamNames) {
        setTeams(teamNames);
      }

      const todoData = await apiCall('todos/list', {
        method: 'POST',
        body: { teamIds: teamIds }
      });

      if (todoData && todoData.data) {
        setTodos(todoData.data);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Initial load
  useEffect(() => {
    refreshData();
  }, [onLogout]);

  // --- Actions ---

  const addTodo = async (task, teamId) => {
    if (!task.trim()) return;
    
    const newTodo = await apiCall('todos', {
      method: 'POST',
      body: {
        task: task,
        teamId: teamId === 'Personal' ? null : teamId
      }
    });
    refreshData();
  };

  const updateTodo = async (id, updates) => {
    const res = await apiCall(`todos/${id}`, {
      method: 'PUT',
      body: updates
    });
    refreshData();
  };

  const deleteTodo = async (id) => {
    const success = await apiCall(`todos/${id}`, { method: 'DELETE' });
    refreshData();
  };

  const createTeam = async () => {
    const res = await apiCall('teams', {
      method: 'POST',
      body: { name: `Team of ${nameOfUser}` }
    });
    refreshData();
  };

  const renameTeam = async (teamId, teamName) => {
    if (!teamName.trim()) return; 

    const res = await apiCall('teams/rename', {
      method: 'POST',
      body: {
        teamId: teamId,
        newTeamname: teamName
      }
    });

    refreshData();
  }
  const addMember = async (teamId, userId) => {
    if (!userId) return;
    if (!teamId) return;

    const res = await apiCall('teams/add_member', { 
      method: 'POST',
      body: { teamId, userId, role: 'member' }
    });

    if (res) {
      alert("Member added successfully!");
      refreshData();
    }
  };

  const removeMember = async (teamId, userId) => {
    // Use the wrapper: pass the endpoint and the options object
    const data = await apiCall('teams/del_member', {
      method: 'POST',
      body: { 
        teamId: teamId, 
        userId: userId 
      },
    });
    if (data) {
      refreshData();
    }
  };

  return { 
    todos, 
    teams,
    teamName,
    teamRoles,
    allUsers,
    teamMembersMap,
    addTodo, 
    updateTodo, 
    deleteTodo, 
    createTeam,
    refreshData,
    setTeamName,
    renameTeam,
    addMember,
    removeMember
  };
};