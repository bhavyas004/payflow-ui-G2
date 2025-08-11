import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/App.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('jwtToken');
      
      // Fetch all HR and Manager users in one call
      const response = await axios.get('/payflowapi/user/hr-managers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allUsers = (response.data || []).map(user => ({
        ...user,
        type: user.role // Use the role from backend
      }));

      setUsers(allUsers);
      setError('');
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    
    // Determine status based on login state
    const matchesStatus = filterStatus === 'ALL' || 
                         (filterStatus === 'ACTIVE' && !user.isFirstLogin) ||
                         (filterStatus === 'FIRST_LOGIN' && user.isFirstLogin);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Search and Filter Section */}
      <div className="filters-section mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="form-group flex-1 min-w-[250px]">
            <label className="form-label">Search Users</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="form-group min-w-[150px]">
            <label className="form-label">Filter by Role</label>
            <select
              className="form-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          
          <div className="form-group min-w-[150px]">
            <label className="form-label">Filter by Status</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="FIRST_LOGIN">First Login Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      {/* Users Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8">
                  {searchTerm || filterRole !== 'ALL' || filterStatus !== 'ALL' 
                    ? 'No users found matching your criteria.'
                    : 'No users available.'
                  }
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span className="font-mono text-sm">
                      {user.role}-{user.id}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium">{user.username}</span>
                  </td>
                  <td>
                    <span className="text-blue-600">{user.email || 'N/A'}</span>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'HR' ? 'badge-info' : 'badge-warning'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${!user.isFirstLogin ? 'badge-success' : 'badge-warning'}`}>
                      {user.isFirstLogin ? 'First Login' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm">{user.contactNumber || 'N/A'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
