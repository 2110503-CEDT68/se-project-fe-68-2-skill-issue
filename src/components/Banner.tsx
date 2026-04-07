import '@/styles/banner.css';

export default function Banner() {
  return (
    <div className="hero-banner">
      <h2>Online Jobfair 2022</h2>
      <p>Your personal dashboard — manage your interview sessions here</p>
      <div className="hero-meta">
        <div className="hero-meta-item">📅 <span>May 10 – 13, 2022</span></div>
        <div className="hero-meta-item">🌐 <span>Online Format</span></div>
        <div className="hero-meta-item">
          📋 <span>Max <strong>3 bookings</strong> per person</span>
        </div>
      </div>
    </div>
  );
}