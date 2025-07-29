import React, { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';
import '../styles/App.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// JWT parser function
function parseJwt(token) {
  if (!token) return {};
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}

function HRSidebar({ active }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}><a href="/hr-dashboard">🏠 Dashboard</a></li>
          <li className={active === 'employees' ? 'active' : ''}><a href="/hr-employees">👥 Employees</a></li>
          <li className={active === 'onboarding' ? 'active' : ''}><a href="/onboarding">📝 Onboarding</a></li>
        </ul>
      </nav>
    </aside>
  );
}

export default function HREmployeeManagement() {
  const [user, setUser] = useState({ name: 'HR Name' });
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    // Extract user info from JWT token
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'User' });
    }
    
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        const res = await axios.get('/payflowapi/onboard-employee/employees', {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        setEmployees(res.data);
      } catch (err) {
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, []);

  const filtered = employees.filter(emp =>
    (emp.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase())) 
      && (statusFilter ? emp.status === statusFilter : true)
  );

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    // Reset to first page if filter/search changes and current page is out of range
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filtered.length, totalPages, currentPage]);

  return (
    <div className="dashboard-layout">
      <HRSidebar active="employees" />
      <div className="main-content">
        <Topbar title="Employee Management" user={user} />
        <div className="employee-management-container" style={{marginTop: '2rem'}}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
            <h2 className="text-xl font-bold mb-2">Employee List</h2>
            <button
              style={{background: '#2563eb', color: '#fff', borderRadius: '6px', padding: '0.5rem 1rem', border: 'none', fontWeight: 600, cursor: 'pointer'}}
              onClick={() => navigate('/onboarding')}
            >
              + Add New Employee
            </button>
          </div>
          <div className="employee-filter-bar">
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <div className="text-sm text-gray-500">
              Showing {filtered.length} of {employees.length} employees
            </div>
          </div>
          <div className="overflow-x-auto employee-table-container">
            <table className="w-full border-collapse border employee-table">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Date Joined</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((emp, index) => (
                  <tr key={index} className="text-center hover:bg-blue-50 transition">
                    <td className="border p-2">{emp.fullName}</td>
                    <td className="border p-2">{emp.email}</td>
                    <td className="border p-2">
                      {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="border p-2">
                      <span className={`px-2 py-1 rounded-full text-white ${emp.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}>{emp.status}</span>
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        className={`px-2 py-1 rounded-full text-white ${emp.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('jwtToken');
                            const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                            await axios.put(`/payflowapi/onboard-employee/${encodeURIComponent(emp.fullName)}/status`, { status: newStatus }, {
                              headers: {
                                Authorization: token ? `Bearer ${token}` : '',
                                'Content-Type': 'application/json'
                              }
                            });
                            setEmployees(prev => prev.map(e => e.fullName === emp.fullName ? { ...e, status: newStatus } : e));
                          } catch (err) {
                            const errorMessage = err.response?.data?.error || err.response?.data || err.message || 'Unknown error';
                            alert('Failed to update status: ' + errorMessage);
                          }
                        }}
                      >
                        {emp.status}
                      </button>
                    </td>
                  </tr>
                ))}
                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-gray-400">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="pagination-controls" style={{marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem'}}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{padding: '0.3rem 0.8rem', borderRadius: '4px', border: '1px solid #ccc', background: currentPage === 1 ? '#eee' : '#fff'}}
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: '4px',
                    border: '1px solid #2563eb',
                    background: currentPage === i + 1 ? '#2563eb' : '#fff',
                    color: currentPage === i + 1 ? '#fff' : '#2563eb',
                    fontWeight: currentPage === i + 1 ? 700 : 400
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{padding: '0.3rem 0.8rem', borderRadius: '4px', border: '1px solid #ccc', background: currentPage === totalPages ? '#eee' : '#fff'}}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}