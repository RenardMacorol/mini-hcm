import React, { useState } from 'react';
import BACKEND_URL from './backendConfig';

import LandingPage from './views/LandingPage';
import LoginPage from './views/LoginPage';
import AccountSetupPage from './views/AccountSetupPage';
import AdminDashboard from './views/AdminDashboard';
import EmployeeDashboard from './views/EmployeeDashboard';

// Theme Tokens (shared across views)
const THEME = {
	bg: '#f8fafc',
	surface: '#ffffff',
	text: '#0f172a',
	textMuted: '#64748b',
	primary: '#2563eb',
	primaryHover: '#1d4ed8',
	success: '#10b981',
	danger: '#ef4444',
	warning: '#f59e0b',
	info: '#06b6d4',
	border: '#e2e8f0',
	radius: '12px'
};

// Global styles placeholder for helper elements
const commonStyles = {
	container: {
		backgroundColor: THEME.bg,
		minHeight: '100vh',
		fontFamily: 'system-ui, -apple-system, sans-serif',
		color: THEME.text,
		padding: '20px',
		boxSizing: 'border-box'
	},
	btn: {
		padding: '10px 18px',
		borderRadius: '6px',
		border: 'none',
		fontWeight: '600',
		cursor: 'pointer',
		fontSize: '14px'
	}
};

export const App = () => {
	// Simple Client-Side Router State: 'landing' | 'login' | 'register' | 'dashboard'
	const [currentView, setCurrentView] = useState('landing');
	const [user, setUser] = useState(null); // Stores logged-in user context { name, email, role, etc. }

	// Handle standard logouts
	const handleLogout = () => {
		setUser(null);
		setCurrentView('landing');
	};

	// Conditional view rendering
	return (
		<div style={commonStyles.container}>
			{currentView === 'landing' && <LandingPage setView={setCurrentView} user={user} />}
			{currentView === 'login' && <LoginPage setView={setCurrentView} setUser={setUser} />}
			{currentView === 'register' && <AccountSetupPage setView={setCurrentView} />}

			{currentView === 'dashboard' && user && (
				user.role === 'Admin'
					? <AdminDashboard user={user} onLogout={handleLogout} setView={setCurrentView} />
					: <EmployeeDashboard user={user} onLogout={handleLogout} />
			)}
		</div>
	);
};
