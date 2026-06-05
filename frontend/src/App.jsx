import React, { useState } from 'react';
import LandingPage from './views/LandingPage';
import AuthPage from './views/AuthPage';
import AdminDashboard from './views/AdminDashboard';
import EmployeeDashboard from './views/EmployeeDashboard';
import { useAuth } from './context/AuthContext.jsx';

const containerStyle = {
	backgroundColor: '#f8fafc',
	minHeight: '100vh',
	fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
	color: '#0f172a',
	boxSizing: 'border-box',
};

export const App = () => {
	const { user, logout, loading } = useAuth();
	const [currentView, setCurrentView] = useState('landing');

	const handleLogout = async () => {
		await logout();
		setCurrentView('landing');
	};

	if (loading) {
		return (
			<div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#64748b' }}>
				Loading session…
			</div>
		);
	}

	return (
		<div style={containerStyle}>
			{currentView === 'landing' && (
				<LandingPage setView={setCurrentView} user={user} onLogout={handleLogout} />
			)}

			{/* 'login' and 'register' both render AuthPage, just with a different starting tab */}
			{(currentView === 'login' || currentView === 'register') && (
				<AuthPage setView={setCurrentView} initialTab={currentView === 'register' ? 'register' : 'login'} />
			)}

			{currentView === 'dashboard' && user && (
				user.role === 'admin'
					? <AdminDashboard onLogout={handleLogout} setView={setCurrentView} />
					: <EmployeeDashboard onLogout={handleLogout} setView={setCurrentView} />
			)}
		</div>
	);
};

export default App;
