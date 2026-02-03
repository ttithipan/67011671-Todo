import React, { useState, useMemo } from 'react';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

import { useTodoManager } from '../hooks/useTodoManager';

// --- Constants ---
const STATUS_CONFIG = [
  { id: '0', title: 'Todo' },
  { id: '1', title: 'Doing' },
  { id: '2', title: 'Done' }
];

// --- Sub-Components ---

const TodoItem = ({ todo, onUpdate, onDelete, role, allUsers, teamMembers }) => {
  const handleStatusChange = (e) => {
    const val = e.target.value;
    val === "DELETE" ? onDelete(todo.id) : onUpdate(todo.id, { done: val });
  };

  const isLeader = role !== 'member';
  const assignedUser = allUsers.find(u => u.id === todo.assignee);

  return (
    <li className="todo-item">
      <div className="task-name">{todo.task}</div>
      <div className="todo-controls">
        
        {/* ASSIGNEE CONTROL */}
        {isLeader ? (
            <FormControl variant="standard" sx={{ minWidth: 100, marginRight: 1 }}>
                <InputLabel id={`assignee-label-${todo.id}`}>Assignee</InputLabel>
                <Select
                    labelId={`assignee-label-${todo.id}`}
                    value={todo.assignee ?? ''} 
                    onChange={(e) => onUpdate(todo.id, { assignee: e.target.value })}
                    label="Assignee"
                    size="small"
                >
                    <MenuItem value=""><em>Unassigned</em></MenuItem>
                    {teamMembers.map(u => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
         ) : (
             <div style={{ marginRight: '10px', fontSize: '0.9em', color: '#666', alignSelf: 'center' }}>
                 {assignedUser ? (assignedUser.full_name || assignedUser.email) : 'Unassigned'}
             </div>
         )}

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

const StatusColumn = ({ title, todos, onUpdate, onDelete, role, allUsers, teamMembers }) => (
  <div className="status-section">
    <h4 >{title}</h4>
    <ul className="todo-list-ul" style={{ listStyle: 'none', padding: 0 }}>
      {todos.map(todo => (
        <TodoItem 
            key={todo.id} 
            todo={todo} 
            onUpdate={onUpdate} 
            onDelete={onDelete} 
            role={role}
            allUsers={allUsers}
            teamMembers={teamMembers}
        />
      ))}
    </ul>
  </div>
);

const AddMemberControl = ({ teamId, allUsers, addMember }) => {
  const [selectedUser, setSelectedUser] = useState('');

  const handleAdd = () => {
    addMember(teamId, selectedUser);
    setSelectedUser(''); 
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <FormControl variant="standard" sx={{ minWidth: 120 }}>
        <InputLabel>Add Member</InputLabel>
        <Select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          label="Add Member"
        >
          {allUsers.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.full_name || user.email}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button 
        variant="contained" 
        size="small" 
        onClick={handleAdd}
        disabled={!selectedUser}
      >
        Add
      </Button>
    </div>
  );
};

// --- NEW COMPONENT: Remove Member Control ---
const RemoveMemberControl = ({ teamId, teamMembers, removeMember }) => {
  const [selectedUser, setSelectedUser] = useState('');

  const handleRemove = () => {
    removeMember(teamId, selectedUser);
    setSelectedUser(''); 
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <FormControl variant="standard" sx={{ minWidth: 120 }}>
        <InputLabel error>Remove Member</InputLabel>
        <Select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          label="Remove Member"
        >
          {teamMembers.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.full_name|| user.email}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button 
        variant="contained" 
        color="error"
        size="small" 
        onClick={handleRemove}
        disabled={!selectedUser}
      >
        Delete
      </Button>
    </div>
  );
};

// --- Updated TeamRow ---
const TeamRow = ({ 
  teamName: initialTeamName, 
  teamId, 
  currentMember, 
  todos, 
  onUpdate, 
  onDelete, 
  renameTeam, 
  role, 
  allUsers, 
  addMember,
  removeMember 
}) => {
 const [currentName, setCurrentName] = useState(initialTeamName);

  React.useEffect(() => {
    setCurrentName(initialTeamName);
  }, [initialTeamName]);

  const teamTodos = useMemo(() => {
    return todos
      .filter(t => teamId ? t.team_id === teamId : !t.team_id)
      .sort((a, b) => new Date(b.updated) - new Date(a.updated));
  }, [todos, teamId]);

  // Derived state: Get full user objects for members currently in this team
  const existingTeamMembers = useMemo(() => {
    // 1. Safety check: ensure currentMember exists
    if (!currentMember) return [];

    // 2. Extract just the user_ids from the membership objects
    const memberIds = currentMember.map(m => m.user_id);

    // 3. Filter allUsers based on those IDs
    return allUsers.filter(u => memberIds.includes(u.id));
  }, [allUsers, currentMember]);

  const handleSave = () => {
     if (currentName !== initialTeamName && currentName.trim() !== "") {
        renameTeam(teamId, currentName);
     }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };
  
  if (teamTodos.length === 0 && teamId) return null;
  const isLeader = role !== 'member';

  return (
    <div className="team-section" >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '15px' }}>
        
        {/* Left Side: Team Name */}
        <div style={{ flexGrow: 1, minWidth: '200px' }}>
          {!isLeader ? (
            <div style={{ fontSize: "20px", fontWeight: "bold", padding: "8px 0", borderBottom: "1px solid #949494" }}>
              {currentName}
            </div>
          ) : (
            <TextField
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)} 
              onBlur={handleSave} 
              onKeyDown={handleKeyDown} 
              variant="standard"
              fullWidth
              sx={{ "& .MuiInputBase-input": { fontSize: "20px", fontWeight: "bold" } }}
            />
          )}
        </div>

        {/* Right Side: Member Controls (Add & Remove) */}
        {isLeader && (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* ADD MEMBER */}
            <AddMemberControl 
              teamId={teamId} 
              allUsers={allUsers} 
              addMember={addMember} 
            />
            
            {/* REMOVE MEMBER (New) */}
            <RemoveMemberControl
              teamId={teamId}
              teamMembers={existingTeamMembers}
              removeMember={removeMember}
            />
          </div>
        )}
      </div>

      <div className="todo-kanban-board">
        {STATUS_CONFIG.map(status => (
          <StatusColumn 
            key={status.id}
            title={status.title}
            todos={teamTodos.filter(t => String(t.done) === status.id)}
            onUpdate={onUpdate}
            onDelete={onDelete}
            role={role}
            allUsers={allUsers}
            teamMembers={existingTeamMembers}
          />
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---
function TodoList({ username, email, userId, full_name, onLogout }) {
  // 1. Initialize the Hook
  const { 
    todos, 
    teams,
    teamRoles,
    teamMembersMap,
    allUsers,
    addTodo, 
    updateTodo, 
    deleteTodo, 
    createTeam, 
    renameTeam,
    addMember,
    removeMember // Destructure the new function
  } = useTodoManager(onLogout, full_name || email);

  // 2. Local State
  const [newTask, setNewTask] = useState();
  const [selectedTeam, setSelectedTeam] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    addTodo(newTask, selectedTeam);
    setNewTask('');
  };

  const allSections = [...teams];
  
  const leaderTeams = teams.filter(team => teamRoles[team.id] !== 'member');
  console.log(teamMembersMap)

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="todo-container">
        
        <div className="todo-header">
          <h2>Task Dashboard</h2>
          <div className='task-dashboard-button-group' >
            <Button variant='outlined' onClick={createTeam}>Add Team</Button>
            <Button variant="contained" color="error" onClick={onLogout}>Logout</Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="todo-form" style={{ display: 'flex', gap: '10px', marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <TextField
            fullWidth
            label="What needs to be done?"
            variant='standard'
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            style={{height:'3rem'}}
          />
          <Select 
            size="small"
            value={selectedTeam}
            variant='standard'
            onChange={(e) => setSelectedTeam(e.target.value)}
            style={{ minWidth: '150px', height:'3rem'}}
          >
            {leaderTeams.map(team => (
              <MenuItem key={team.id} value={team.id} >{team.name}</MenuItem>
            ))}
          </Select>
          <Button variant="contained" color="primary" type="submit" disabled={!newTask} style={{ width:'10rem'}}>Add Task</Button>
        </form>

        <div className="all-teams-container">
          {allSections.map(section => (
            <TeamRow 
              key={section.id}
              teamName={section.name}
              teamId={section.id}
              currentMember={teamMembersMap[section.id]}
              todos={todos}
              onUpdate={updateTodo}
              onDelete={deleteTodo}
              renameTeam={renameTeam}
              role={teamRoles[section.id]}
              addMember={addMember}
              removeMember={removeMember} // Pass down
              allUsers={allUsers}
            />
          ))}
        </div>

      </div>
    </LocalizationProvider>
  );
}

export default TodoList;