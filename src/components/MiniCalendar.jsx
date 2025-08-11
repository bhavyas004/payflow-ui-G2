import React from 'react';
import '../styles/App.css';

const MiniCalendar = ({ events }) => (
  <div className="card">
    <div className="card-content">
      <h4 className="font-semibold mb-4">Upcoming Events</h4>
      <ul className="space-y-3">
        {events && events.length > 0 ? (
          events.map((event, idx) => (
            <li key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="badge badge-info">{event.date}</span>
              <span className="text-sm text-gray-700">{event.title}</span>
            </li>
          ))
        ) : (
          <li className="text-gray-500 text-sm text-center py-4">No upcoming events</li>
        )}
      </ul>
    </div>
  </div>
);

export default MiniCalendar; 