import { useState } from 'react';
import { THEME, commonStyles } from '../components/CommonStyles';

const LoginPage = ({ setView, setUser }) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [status, setStatus] = useState({ loading: false, error: null });

	const handleLogin = async (e) => {
		e.preventDefault();
		setStatus({ loading: true, error: null });

		try {
			const baseUrl = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'http://localhost:5000';
			const response = await fetch(`${baseUrl}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				// The backend sends error details in data.error or data.details
				throw new Error(data.error || data.details || 'Invalid login details.');
			}

			// ==========================================
			// ✨ THE FIX: Store the fresh token from your backend response
			// ==========================================
			if (data.idToken) {
				localStorage.setItem('authToken', data.idToken);
			} else {
				throw new Error('Authentication token missing from server response.');
			}

			// Set user profile state and redirect to dashboard
			setUser(data.user);
			setView('dashboard');
		} catch (err) {
			setStatus({ loading: false, error: err.message });
		}
	};

	const styles = {
		card: { backgroundColor: THEME.surface, borderRadius: THEME.radius, maxWidth: '400px', margin: '60px auto', padding: '32px', border: `1px solid ${THEME.border}` },
		input: { width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxSizing: 'border-box' }
	};

	return (
		<div style={styles.card}>
			<h2 style={{ marginBottom: '8px', fontWeight: '700' }}>Sign In</h2>
			<p style={{ color: THEME.textMuted, fontSize: '14px', marginBottom: '24px' }}>Access your company portal</p>

			{status.error && <div style={{ color: THEME.danger, marginBottom: '12px', fontSize: '14px' }}>⚠️ {status.error}</div>}

			<form onSubmit={handleLogin}>
				<label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>Email Address</label>
				<input type="email" required style={styles.input} value={email} onChange={e => setEmail(e.target.value)} />

				<label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>Password</label>
				<input type="password" required style={styles.input} value={password} onChange={e => setPassword(e.target.value)} />

				<button type="submit" disabled={status.loading} style={{ ...commonStyles.btn, backgroundColor: THEME.primary, color: '#fff', width: '100%' }}>
					{status.loading ? 'Verifying...' : 'Sign In'}
				</button>
			</form>
		</div>
	);
};

export default LoginPage;
