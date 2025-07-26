import React from 'react';
import '../styles/App.css';

const MiniCalendar = ({ events }) => (
  <div className="mini-calendar-widget">
    <h4>Upcoming Events</h4>
    <ul>
      {events && events.length > 0 ? (
        events.map((event, idx) => (
          <li key={idx}>
            <span>{event.date}:</span> {event.title}
          </li>
        ))
      ) : (
        <li>No upcoming events</li>
      )}
    </ul>
  </div>
);

export default MiniCalendar; 