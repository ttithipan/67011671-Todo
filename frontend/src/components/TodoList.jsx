import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  TextField, Button, Select, MenuItem, 
  FormControl, InputLabel 
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

import { useTodoManager } from '../hooks/useTodoManager';

/**
 * Global Constants
 * STATUS_CONFIG: Defines the Kanban columns and their display titles.
 */
const STATUS_CONFIG = [
  { id: '0', title: 'Todo' },
  { id: '1', title: 'Doing' },
  { id: '2', title: 'Done' }
];

/**
 * Component: TodoItem
 * Renders an individual task row with assignee selection, date picker, and status dropdown.
 * Logic: 
 * - Determines if user is a leader to enable/disable assignment.
 * - Handles deletion through the status dropdown.
 */
const TodoItem = ({ todo, onUpdate, onDelete, role, allUsers, teamMembers }) => {
  const isLeader = role !== 'member';
  const assignedUser = allUsers.find(u => u.id === todo.assignee);

  const handleStatusChange = (e) => {
    const val = e.target.value;
    val === "DELETE" ? onDelete(todo.id) : onUpdate(todo.id, { done: val });
  };

  return (
    <li className="todo-item">
      <div className="task-name">{todo.task}</div>
      <div className="todo-controls">
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
                <MenuItem key={u.id} value={u.id}>{u.full_name || u.email}</MenuItem>
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

        <Select size="small" value={String(todo.done)} onChange={handleStatusChange}>
          {STATUS_CONFIG.map(s => <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>)}
          <MenuItem value="DELETE" sx={{ color: "red" }}>Delete</MenuItem>
        </Select>
      </div>
    </li>
  );
};

/**
 * Component: StatusColumn
 * Renders a single Kanban column (Todo, Doing, or Done).
 */
const StatusColumn = ({ title, todos, ...props }) => (
  <div className="status-section">
    <h4>{title}</h4>
    <ul className="todo-list-ul" style={{ listStyle: 'none', padding: 0 }}>
      {todos.map(todo => <TodoItem key={todo.id} todo={todo} {...props} />)}
    </ul>
  </div>
);

/**
 * Component: AddMemberControl
 * Provides a dropdown of users NOT in the current team and a button to add them.
 */
const AddMemberControl = ({ teamId, nonCurrentMember, addMember }) => {
  const [selectedUser, setSelectedUser] = useState('');

  const handleAdd = () => {
    addMember(teamId, selectedUser);
    setSelectedUser('');
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <FormControl variant="standard" sx={{ minWidth: 120 }}>
        <InputLabel>Add Member</InputLabel>
        <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          {nonCurrentMember.map((user) => (
            <MenuItem key={user.id} value={user.id}>{user.full_name || user.email}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" size="small" onClick={handleAdd} disabled={!selectedUser}>Add</Button>
    </div>
  );
};

/**
 * Component: RemoveMemberControl
 * Provides a dropdown of existing team members and a button to remove them.
 */
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
        <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          {teamMembers.map((user) => (
            <MenuItem key={user.id} value={user.id}>{user.full_name || user.email}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" color="error" size="small" onClick={handleRemove} disabled={!selectedUser}>Delete</Button>
    </div>
  );
};

/**
 * Component: TeamRow
 * Manages the layout for a single Team, including its name (editable by leaders),
 * member management controls, and the Kanban board.
 * Logic:
 * - Filters tasks specific to this team.
 * - Computes 'existing' vs 'non-team' members for the dropdowns.
 * - Handles team renaming on blur or Enter key.
 */
const TeamRow = ({ 
  teamName: initialTeamName, teamId, currentMember, todos, 
  onUpdate, onDelete, renameTeam, role, allUsers, 
  addMember, removeMember 
}) => {
  const [currentName, setCurrentName] = useState(initialTeamName);
  const isLeader = role !== 'member';

  useEffect(() => { setCurrentName(initialTeamName); }, [initialTeamName]);

  const teamTodos = useMemo(() => {
    return todos
      .filter(t => teamId ? t.team_id === teamId : !t.team_id)
      .sort((a, b) => new Date(b.updated) - new Date(a.updated));
  }, [todos, teamId]);

  const existingTeamMembers = useMemo(() => {
    if (!currentMember) return [];
    const memberIds = currentMember.map(m => m.user_id);
    return allUsers.filter(u => memberIds.includes(u.id));
  }, [allUsers, currentMember]);

  const nonTeamMembers = useMemo(() => {
    if (!currentMember) return allUsers;
    const memberIds = currentMember.map(m => m.user_id);
    return allUsers.filter(u => !memberIds.includes(u.id));
  }, [allUsers, currentMember]);

  const handleSaveName = () => {
    if (currentName !== initialTeamName && currentName.trim() !== "") {
      renameTeam(teamId, currentName);
    }
  };

  if (teamTodos.length === 0 && teamId) return null;

  return (
    <div className="team-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ flexGrow: 1, minWidth: '200px' }}>
          {!isLeader ? (
            <div style={{ fontSize: "20px", fontWeight: "bold", padding: "8px 0", borderBottom: "1px solid #949494" }}>{currentName}</div>
          ) : (
            <TextField
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              variant="standard"
              fullWidth
              sx={{ "& .MuiInputBase-input": { fontSize: "20px", fontWeight: "bold" } }}
            />
          )}
        </div>

        {isLeader && (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <AddMemberControl teamId={teamId} nonCurrentMember={nonTeamMembers} addMember={addMember} />
            <RemoveMemberControl teamId={teamId} teamMembers={existingTeamMembers} removeMember={removeMember} />
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

/**
 * Main Component: TodoList
 * The primary dashboard view. 
 * Logic:
 * - Orchestrates data from useTodoManager.
 * - Handles the "Add Task" form logic.
 * - Renders the list of TeamRows.
 */
function TodoList({ username, email, userId, full_name, onLogout }) {
  const { 
    todos, teams, teamRoles, teamMembersMap, allUsers,
    addTodo, updateTodo, deleteTodo, createTeam, renameTeam,
    addMember, removeMember 
  } = useTodoManager(onLogout, full_name || email);

  const [newTask, setNewTask] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask) return;
    addTodo(newTask, selectedTeam);
    setNewTask('');
  };

  const leaderTeams = useMemo(() => 
    teams.filter(team => teamRoles[team.id] !== 'member'), 
    [teams, teamRoles]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="todo-container">
        <header className="todo-header">
          <h2>Task Dashboard</h2>
          <div className='task-dashboard-button-group'>
            <Button variant='outlined' onClick={createTeam}>Add Team</Button>
            <Button variant="contained" color="error" onClick={onLogout}>Logout</Button>
          </div>
        </header>

        <form onSubmit={handleAddTask} className="todo-form" style={{ display: 'flex', gap: '10px', marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <TextField
            fullWidth
            label="What needs to be done?"
            variant='standard'
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            sx={{ height: '3rem' }}
          />
          <Select 
            size="small"
            value={selectedTeam}
            variant='standard'
            onChange={(e) => setSelectedTeam(e.target.value)}
            sx={{ minWidth: '150px', height: '3rem' }}
          >
            {leaderTeams.map(team => (
              <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
            ))}
          </Select>
          <Button variant="contained" type="submit" disabled={!newTask || !selectedTeam} sx={{ width: '10rem' }}>Add Task</Button>
        </form>

        <section className="all-teams-container">
          {teams.map(section => (
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
              removeMember={removeMember}
              allUsers={allUsers}
            />
          ))}
        </section>
      </div>
    </LocalizationProvider>
  );
}

export default TodoList;