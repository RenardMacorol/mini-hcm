import React, { useState } from 'react';
import BACKEND_URL from './backendConfig';

import LandingPage from './views/LandingPage';
import LoginPage from './views/LoginPage';
import AdminDashboard from './views/AdminDashboard';
import EmployeeDashboard from './views/EmployeeDashboard';
import RegisterPage from './views/RegisterPage';
import { useAuth } from './context/AuthContext.jsx';

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
	const { user, logout, loading } = useAuth();
	const [currentView, setCurrentView] = useState('landing');

	const handleLogout = async () => {
		await auth.signOut();
		localStorage.removeItem("authToken");
		setUser(null);
		setCurrentView("landing"); // or login
	};

	if (loading) {
		return <div>Loading session...</div>;
	}

	return (
		<div style={commonStyles.container}>
			{currentView === "landing" && <LandingPage setView={setCurrentView} user={user} />}

			{currentView === "login" && (
				<LoginPage setView={setCurrentView} />
			)}

			{currentView === "register" && (
				<RegisterPage setView={setCurrentView} />
			)}

			{currentView === "dashboard" && user && (
				user.role === "admin"
					? <AdminDashboard user={user} onLogout={logout} setView={setCurrentView} />
					: <EmployeeDashboard user={user} onLogout={logout} />
			)}
		</div>
	);

};
