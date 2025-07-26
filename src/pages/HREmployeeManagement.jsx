import React, { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';
import '../styles/App.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  const [user] = useState({ name: 'HR Name' });
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
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
    // Department and date filter logic removed
  );

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
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, index) => (
                  <tr key={index} className="text-center hover:bg-blue-50 transition">
                    <td className="border p-2">{emp.fullName}</td>
                    <td className="border p-2">{emp.email}</td>
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
                                Authorization: token ? `Bearer ${token}` : ''
                              }
                            });
                            setEmployees(prev => prev.map(e => e.fullName === emp.fullName ? { ...e, status: newStatus } : e));
                          } catch (err) {
                            alert('Failed to update status');
                          }
                        }}
                      >
                        {emp.status}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-gray-400">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}