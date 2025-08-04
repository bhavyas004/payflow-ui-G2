import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import axios from 'axios';
import '../styles/App.css';

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

// Custom Sidebar for Employee Dashboard
function EmployeeSidebar({ active }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/employee-login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}><a href="/employee-dashboard">🏠 Dashboard</a></li>
          <li className={active === 'leave-requests' ? 'active' : ''}><a href="/employee-leave-requests">📋 My Leave Requests</a></li>
          <li className={active === 'leave-request' ? 'active' : ''}><a href="/employee-leave-request">📝 Apply Leave</a></li>
          <li className={active === 'payroll' ? 'active' : ''}><a href="/employee-payroll">💰 Payroll</a></li>
          <li><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></li>
        </ul>
      </nav>
    </aside>
  );
}

// ...existing code...

export default function EmployeeLeaveRequests() {
  const [user, setUser] = useState({ name: 'Employee' });
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [allLeaveRequests, setAllLeaveRequests] = useState([]); // Store all requests
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Counts for each status
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    // Extract user info from JWT token
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ 
        name: payload.fullName || payload.sub || payload.username || 'Employee',
        employeeId: payload.employeeId,
        status: payload.status
      });
    }
  }, []);

  useEffect(() => {
    fetchAllLeaveRequests();
  }, []);

  useEffect(() => {
    filterRequestsByTab();
  }, [selectedTab, currentPage, allLeaveRequests]);

  // Fetch all leave requests and calculate counts
  const fetchAllLeaveRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('jwtToken');
      const payload = parseJwt(token);
      const employeeId = payload.employeeId;

      if (!employeeId) {
        setError('Employee ID not found');
        return;
      }

      // Fetch all requests at once (with a large page size to get everything)
      const url = `/payflowapi/leave-requests/employee/${employeeId}?page=0&size=1000`;
      
      console.log('Fetching all requests from URL:', url);

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        const allRequests = response.data.data || [];
        setAllLeaveRequests(allRequests);

        // Calculate counts for each status
        const counts = {
          all: allRequests.length,
          pending: allRequests.filter(req => req.status?.toLowerCase() === 'pending').length,
          approved: allRequests.filter(req => req.status?.toLowerCase() === 'approved').length,
          rejected: allRequests.filter(req => req.status?.toLowerCase() === 'rejected').length
        };
        
        setStatusCounts(counts);
        
        console.log('Status counts:', counts);
        
        // Filter requests for current tab
        filterRequestsByTabStatus(allRequests, selectedTab);
        
      } else {
        setError('Failed to fetch leave requests');
        setAllLeaveRequests([]);
        setLeaveRequests([]);
        setStatusCounts({ all: 0, pending: 0, approved: 0, rejected: 0 });
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError('Error loading leave requests');
      setAllLeaveRequests([]);
      setLeaveRequests([]);
      setStatusCounts({ all: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on selected tab
  const filterRequestsByTab = () => {
    filterRequestsByTabStatus(allLeaveRequests, selectedTab);
  };

  const filterRequestsByTabStatus = (requests, tab) => {
    let filteredRequests = [];
    
    if (tab === 'all') {
      filteredRequests = requests;
    } else {
      filteredRequests = requests.filter(req => 
        req.status?.toLowerCase() === tab.toLowerCase()
      );
    }

    // Apply pagination
    const pageSize = 10;
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
    
    setLeaveRequests(paginatedRequests);
    setTotalElements(filteredRequests.length);
    setTotalPages(Math.ceil(filteredRequests.length / pageSize));
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setCurrentPage(0);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="dashboard-layout">
      <EmployeeSidebar active="leave-requests" />
      <div className="main-content">
        <Topbar
          title="My Leave Requests"
          user={user}
          onLogout={() => {
            localStorage.removeItem('jwtToken');
            navigate('/employee-login');
          }}
        />
        
        <div className="leave-requests-container">
          {/* Header */}
          <div className="leave-requests-header">
            <h2>My Leave Requests</h2>
            <button 
              className="apply-leave-btn" 
              onClick={() => navigate('/employee-leave-request')}
            >
              📝 Apply for Leave
            </button>
          </div>

          {/* Tabs */}
          <div className="leave-requests-tabs">
            <button 
              className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              All ({statusCounts.all})
            </button>
            <button 
              className={`tab-btn ${selectedTab === 'pending' ? 'active' : ''}`}
              onClick={() => handleTabChange('pending')}
            >
              Pending ({statusCounts.pending})
            </button>
            <button 
              className={`tab-btn ${selectedTab === 'approved' ? 'active' : ''}`}
              onClick={() => handleTabChange('approved')}
            >
              Approved ({statusCounts.approved})
            </button>
            <button 
              className={`tab-btn ${selectedTab === 'rejected' ? 'active' : ''}`}
              onClick={() => handleTabChange('rejected')}
            >
              Rejected ({statusCounts.rejected})
            </button>
          </div>

          {/* Content */}
          <div className="leave-requests-content">
            {loading ? (
              <div className="loading-message">Loading leave requests...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : leaveRequests.length === 0 ? (
              <div className="no-requests-message">
                {statusCounts.all === 0 ? (
                  // Show "Apply for first leave" only if no requests exist at all
                  <>
                    <h3>No leave requests found</h3>
                    <p>You haven't applied for any leaves yet.</p>
                    <button 
                      className="apply-leave-btn" 
                      onClick={() => navigate('/employee-leave-request')}
                    >
                      📝 Apply for Your First Leave
                    </button>
                  </>
                ) : (
                  // Show filtered message if requests exist but none in current tab
                  <>
                    <h3>No {selectedTab} leave requests found</h3>
                    <p>You don't have any {selectedTab.toLowerCase()} leave requests at the moment.</p>
                    
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="leave-requests-grid">
                  {leaveRequests.map((request) => (
                    <div key={request.id} className="leave-request-card">
                      <div className="leave-card-header">
                        <div className="leave-id">Leave ID: #{request.id}</div>
                        <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                          {request.status}
                        </span>
                      </div>

                      <div className="leave-card-body">
                        <div className="leave-detail-row">
                          <span className="detail-label">Applied Date:</span>
                          <span className="detail-value">{formatDate(request.createdAt)}</span>
                        </div>

                        <div className="leave-detail-row">
                          <span className="detail-label">Leave Period:</span>
                          <span className="detail-value">
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                          </span>
                        </div>

                        <div className="leave-detail-row">
                          <span className="detail-label">Duration:</span>
                          <span className="detail-value">{request.totalDays} days</span>
                        </div>

                        <div className="leave-detail-row">
                          <span className="detail-label">Reason:</span>
                          <span className="detail-value">
                            {request.reason || 'No reason provided'}
                          </span>
                        </div>

                        {request.approvedBy && (
                          <div className="leave-detail-row">
                            <span className="detail-label">Approved By:</span>
                            <span className="detail-value">{request.approvedBy}</span>
                          </div>
                        )}

                        {request.approvedDate && (
                          <div className="leave-detail-row">
                            <span className="detail-label">Approved At:</span>
                            <span className="detail-value">{formatDateTime(request.approvedDate)}</span>
                          </div>
                        )}

                        {request.rejectedBy && (
                          <div className="leave-detail-row">
                            <span className="detail-label">Rejected By:</span>
                            <span className="detail-value">{request.rejectedBy}</span>
                          </div>
                        )}

                        {request.rejectedAt && (
                          <div className="leave-detail-row">
                            <span className="detail-label">Rejected At:</span>
                            <span className="detail-value">{formatDateTime(request.rejectedAt)}</span>
                          </div>
                        )}

                        {request.remarks && (
                          <div className="leave-detail-row">
                            <span className="detail-label">Remarks:</span>
                            <span className="detail-value remarks-text">
                              {request.remarks}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="leave-card-footer">
                        <div className="leave-year">Year: {request.leaveYear}</div>
                        <div className="created-at">
                          Created: {formatDateTime(request.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="pagination-btn"
                    >
                      ← Previous
                    </button>
                    
                    <span className="pagination-info">
                      Page {currentPage + 1} of {totalPages} ({totalElements} total)
                    </span>
                    
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="pagination-btn"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
