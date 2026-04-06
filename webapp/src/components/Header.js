import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const pageTitles = {
  '/dashboard':       'Dashboard',
  '/transactions':    'Transactions',
  '/analytics':       'Analytics',
  '/categories-page': 'Categories',
  '/accounts':        'Accounts',
};

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();

  const title = pageTitles[location.pathname] || 'Walleto';

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
        </p>
      </div>
      <div className="header-right">
        <div className="header-date">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        <div className="header-user">
          <div className="header-avatar">{getInitials(user?.name)}</div>
          <span className="header-user-name">{user?.name || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
