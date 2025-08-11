import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Topbar from '../components/Topbar';
import axios from 'axios';
import '../styles/App.css';
import '../styles/ManagerLeaveRequests.css';

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

// Manager Sidebar
function ManagerSidebar({ active }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}><a href="/manager-dashboard">🏠 Dashboard</a></li>
          <li className={active === 'employees' ? 'active' : ''}><a href="/hr-employees">👥 Employees</a></li>
          <li className={active === 'onboarding' ? 'active' : ''}><a href="/onboarding">📝 Onboarding</a></li>
          <li className={active === 'leave-requests' ? 'active' : ''}><a href="/manager-leave-requests">📋 Leave Requests</a></li>
        </ul>
      </nav>
    </aside>
  );
}

export default function ManagerLeaveRequests() {
  const [user, setUser] = useState({ name: 'Manager' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'ALL');
  const [actionModal, setActionModal] = useState({ show: false, request: null, action: '' });
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'Manager' });
    }
    
    fetchLeaveRequests();
  }, [selectedStatus]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('jwtToken');
      
      let url = '/payflowapi/leave-requests/manager/team';
      if (selectedStatus !== 'ALL') {
        url += `?status=${selectedStatus}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setLeaveRequests(response.data.data || []);
      } else {
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    navigate(`/manager-leave-requests${status !== 'ALL' ? `?status=${status}` : ''}`);
  };

  const openActionModal = (request, action) => {
    setActionModal({ show: true, request, action });
    setRemarks('');
  };

  const closeActionModal = () => {
    setActionModal({ show: false, request: null, action: '' });
    setRemarks('');
  };

  const handleLeaveAction = async () => {
    try {
      const token = sessionStorage.getItem('jwtToken');
      const { request, action } = actionModal;
      
      const endpoint = action === 'approve' 
        ? `/payflowapi/leave-requests/${request.id}/approve`
        : `/payflowapi/leave-requests/${request.id}/reject`;
      
      await axios.put(endpoint, { remarks }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`Leave request ${action}d successfully! Email notification sent to employee.`);
      closeActionModal();
      fetchLeaveRequests(); // Refresh the list
    } catch (error) {
      console.error(`Error ${actionModal.action}ing leave request:`, error);
      alert(`Failed to ${actionModal.action} leave request: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('jwtToken');
    navigate('/');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'status-badge status-pending';
      case 'APPROVED': return 'status-badge status-approved';
      case 'REJECTED': return 'status-badge status-rejected';
      case 'CANCELLED': return 'status-badge status-cancelled';
      default: return 'status-badge';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-layout">
      <ManagerSidebar active="leave-requests" />
      <div className="main-content">
        <Topbar
          title="Team Leave Requests"
          user={user}
          onLogout={handleLogout}
        />
        
        <div className="leave-requests-page">
          {/* Header Section */}
          <div className="page-header">
            <div className="header-content">
              <h2 className="page-title">Leave Request Management</h2>
              <p className="page-subtitle">Review and manage your team's leave requests</p>
            </div>
          </div>

          {/* Filter Section */}
          <div className="filter-section">
            <div className="filter-container">
              <h3 className="filter-title">Filter by Status</h3>
              <div className="filter-buttons">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(status => (
                  <button
                    key={status}
                    className={`filter-btn filter-btn-${status.toLowerCase()} ${selectedStatus === status ? 'active' : ''}`}
                    onClick={() => handleStatusFilter(status)}
                  >
                    <span className="filter-btn-text">{status}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="content-section">
            <div className="table-wrapper">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p className="loading-text">Loading leave requests...</p>
                </div>
              ) : leaveRequests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3 className="empty-state-title">No Leave Requests Found</h3>
                  <p className="empty-state-text">
                    {selectedStatus === 'ALL' 
                      ? "Your team hasn't submitted any leave requests yet."
                      : `No ${selectedStatus.toLowerCase()} leave requests found.`
                    }
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="leave-requests-table">
                    <thead>
                      <tr>
                        <th className="th-employee">Employee</th>
                        <th className="th-dates">Duration</th>
                        <th className="th-days">Days</th>
                        <th className="th-reason">Reason</th>
                        <th className="th-status">Status</th>
                        <th className="th-applied">Applied</th>
                        <th className="th-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map(request => (
                        <tr key={request.id} className="table-row">
                          <td className="td-employee">
                            <div className="employee-info">
                              <div className="employee-avatar">
                                {request.employeeName?.charAt(0)?.toUpperCase()}
                              </div>
                              <div className="employee-details">
                                <div className="employee-name">{request.employeeName}</div>
                                <div className="employee-email">{request.employeeEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="td-dates">
                            <div className="date-range">
                              <div className="start-date">{formatDate(request.startDate)}</div>
                              <div className="date-separator">to</div>
                              <div className="end-date">{formatDate(request.endDate)}</div>
                            </div>
                          </td>
                          <td className="td-days">
                            <span className="days-count">{request.totalDays}</span>
                          </td>
                          <td className="td-reason">
                            <div className="reason-text" title={request.reason}>
                              {request.reason.length > 40 
                                ? `${request.reason.substring(0, 40)}...` 
                                : request.reason}
                            </div>
                          </td>
                          <td className="td-status">
                            <span className={getStatusBadgeClass(request.status)}>
                              {request.status}
                            </span>
                          </td>
                          <td className="td-applied">
                            <span className="applied-date">{formatDate(request.createdAt)}</span>
                          </td>
                          <td className="td-actions">
                            {request.status === 'PENDING' ? (
                              <div className="action-buttons">
                                <button
                                  className="action-btn approve-btn"
                                  onClick={() => openActionModal(request, 'approve')}
                                  title="Approve Request"
                                >
                                  <span className="btn-icon">✓</span>
                                  <span className="btn-text">Approve</span>
                                </button>
                                <button
                                  className="action-btn reject-btn"
                                  onClick={() => openActionModal(request, 'reject')}
                                  title="Reject Request"
                                >
                                  <span className="btn-icon">✗</span>
                                  <span className="btn-text">Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="action-status">
                                {request.status === 'APPROVED' ? 'Approved' : 
                                 request.status === 'REJECTED' ? 'Rejected' : 
                                 'Completed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Modal */}
        {actionModal.show && (
          <div className="modal-overlay" onClick={closeActionModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {actionModal.action === 'approve' ? 'Approve' : 'Reject'} Leave Request
                </h3>
                <button className="modal-close" onClick={closeActionModal}>
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="request-details">
                  <div className="detail-row">
                    <span className="detail-label">Employee:</span>
                    <span className="detail-value">{actionModal.request?.employeeName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">
                      {formatDate(actionModal.request?.startDate)} to {formatDate(actionModal.request?.endDate)} 
                      ({actionModal.request?.totalDays} days)
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Reason:</span>
                    <span className="detail-value">{actionModal.request?.reason}</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="remarks" className="form-label">
                    Manager Remarks (Optional):
                  </label>
                  <textarea
                    id="remarks"
                    className="form-textarea"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={`Add remarks for ${actionModal.action}al...`}
                    rows="4"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="modal-btn cancel-btn" onClick={closeActionModal}>
                  Cancel
                </button>
                <button 
                  className={`modal-btn ${actionModal.action === 'approve' ? 'approve-btn' : 'reject-btn'}`}
                  onClick={handleLeaveAction}
                >
                  {actionModal.action === 'approve' ? 'Approve Request' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}