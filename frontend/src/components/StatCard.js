import './StatCard.css';

const StatCard = ({ icon, label, value, color = 'accent', trend, loading = false }) => {
  const iconClass = {
    accent:  'stat-card-icon--accent',
    success: 'stat-card-icon--success',
    danger:  'stat-card-icon--danger',
    warning: 'stat-card-icon--warning',
  }[color] || 'stat-card-icon--accent';

  const trendColor = trend?.positive ? '#00875a' : 'var(--error)';

  return (
    <div className="stat-card">
      <div className="stat-card-inner">
        <div className={`stat-card-icon ${iconClass}`}>
          {icon}
        </div>
        <div className="stat-card-content">
          <p className="stat-card-label">{label}</p>
          {loading ? (
            <div className="stat-card-skeleton" />
          ) : (
            <p className="stat-card-value">{value}</p>
          )}
          {trend && !loading && (
            <p className="stat-card-trend" style={{ color: trendColor }}>
              {trend.positive ? '▲' : '▼'} {trend.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
