import { useState } from 'react';
import axios from 'axios';
import './App.css';

export default function CreateUser() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('HR');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8080/admin/create-user', {
        username,
        password,
        role
      });
      alert("User created: " + res.data);
      setUsername('');
      setPassword('');
      setRole('HR');
    } catch (err) {
      alert("Failed to create user");
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2 className="sidebar-title">Admin Dashboard</h2>
        <ul className="sidebar-links">
          <li><strong>Create User</strong></li>
          <li>Other Links</li>
        </ul>
      </aside>

      <main className="main-content">
        <h2>Create HR / Manager</h2>
        <form className="user-form" onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />

          <label>Temporary Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />

          <label>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="HR">HR</option>
            <option value="MANAGER">Manager</option>
          </select>

          <button type="submit">Create User</button>
        </form>
      </main>
    </div>
  );
}
