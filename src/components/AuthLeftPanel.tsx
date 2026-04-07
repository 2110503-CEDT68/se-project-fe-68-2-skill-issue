'use client';

import '@/styles/login.css';
import '@/styles/topMenu.css';

export default function AuthLeftPanel() {
  return (
    <div className="panel-left">
      <div className="brand">
        <span className="brand-dot" />
        <span className="brand-name">Online Jobfair</span>
      </div>

      <div className="left-content">
        <div className="event-label">Event Registration</div>
        <h1 className="left-title">
          Find your<br />
          <em>next great</em><br />
          opportunity.
        </h1>

        <div className="info-item">
          <div className="info-icon">📅</div>
          <div className="info-text">
            <strong>Date</strong>May 10 – 13, 2022
          </div>
        </div>
        <div className="info-item">
          <div className="info-icon">🌐</div>
          <div className="info-text">
            <strong>Format</strong>Online — Zoom / Live Stream
          </div>
        </div>
        <div className="info-item">
          <div className="info-icon">📋</div>
          <div className="info-text">
            <strong>Bookings</strong>Up to 3 companies per person
          </div>
        </div>
      </div>

      <div className="deco" />
    </div>
  );
}
