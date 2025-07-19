import { useState } from 'react';
import axios from 'axios';

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Simulated backend call
      const res = await axios.post('http://localhost:8080/admin/login', {
        username,
        password,
      });
      alert("Login successful");
      onLoginSuccess();
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="login-box">
      <h2 className="login-title">Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
