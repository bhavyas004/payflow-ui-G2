import React, { useState, useEffect } from 'react';
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

const LeaveInfoSidebar = ({ isOpen, onClose }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchLeaveRequests();
    }
  }, [isOpen, selectedTab]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const token = sessionStorage.getItem('jwtToken');
      const payload = parseJwt(token);
      const employeeId = payload.employeeId;

      if (!employeeId) {
        setError('Employee ID not found');
        return;
      }

      let url = `/payflowapi/leave-requests/employee/${employeeId}`;
      if (selectedTab !== 'all') {
        url = `/payflowapi/leave-requests/status/${selectedTab.toUpperCase()}?employeeId=${employeeId}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        let requests = response.data.data || [];
        
        // Filter by employee if using status endpoint
        if (selectedTab !== 'all') {
          requests = requests.filter(req => req.employeeId === employeeId);
        }
        
        // Sort by creation date (newest first)
        requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setLeaveRequests(requests);
      } else {
        setError('Failed to fetch leave requests');
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError('Error loading leave requests');
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
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

  if (!isOpen) return null;

  return (
    <div className="leave-sidebar-overlay">
      <div className="leave-sidebar">
        <div className="leave-sidebar-header">
          <h3>My Leave Requests</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="leave-sidebar-tabs">
          <button 
            className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTab('all')}
          >
            All
          </button>
          <button 
            className={`tab-btn ${selectedTab === 'pending' ? 'active' : ''}`}
            onClick={() => setSelectedTab('pending')}
          >
            Pending
          </button>
          <button 
            className={`tab-btn ${selectedTab === 'approved' ? 'active' : ''}`}
            onClick={() => setSelectedTab('approved')}
          >
            Approved
          </button>
          <button 
            className={`tab-btn ${selectedTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setSelectedTab('rejected')}
          >
            Rejected
          </button>
        </div>

        <div className="leave-sidebar-content">
          {loading ? (
            <div className="loading-message">Loading leave requests...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : leaveRequests.length === 0 ? (
            <div className="no-requests-message">
              No {selectedTab === 'all' ? '' : selectedTab} leave requests found
            </div>
          ) : (
            <div className="leave-requests-list">
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
                      <span className="detail-value reason-text">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveInfoSidebar;
