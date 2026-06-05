import { useState } from 'react';
import { THEME, commonStyles } from '../components/CommonStyles';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

const LoginPage = ({ setView }) => {
	const { setUser } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [status, setStatus] = useState({ loading: false, error: null });

	const handleLogin = async (e) => {
		e.preventDefault();
		setStatus({ loading: true, error: null });

		try {
			await signInWithEmailAndPassword(auth, email, password);

			setView('dashboard');

		} catch (err) {
			setStatus({ loading: false, error: err.message });
		}
	};

	const styles = {
		card: {
			backgroundColor: THEME.surface,
			borderRadius: THEME.radius,
			maxWidth: '400px',
			margin: '60px auto',
			padding: '32px',
			border: `1px solid ${THEME.border}`,
			textAlign: 'center'
		},
		input: {
			width: '100%',
			padding: '10px',
			borderRadius: '6px',
			border: `1px solid ${THEME.border}`,
			marginBottom: '16px',
			boxSizing: 'border-box',
		},
		tabRow: {
			display: 'flex',
			marginBottom: '20px',
			borderRadius: '8px',
			overflow: 'hidden',
			border: `1px solid ${THEME.border}`
		},
		tab: (active) => ({
			flex: 1,
			padding: '10px',
			cursor: 'pointer',
			backgroundColor: active ? THEME.primary : THEME.surface,
			color: active ? '#fff' : THEME.text,
			fontWeight: '600',
		})
	};

	return (
		<div style={styles.card}>
			<h2 style={{ marginBottom: '10px' }}>Welcome</h2>

			{/* 🔥 Tabs */}
			<div style={styles.tabRow}>
				<div
					style={styles.tab(true)}
				>
					Sign In
				</div>

				<div
					style={styles.tab(false)}
					onClick={() => setView('register')}
				>
					Register
				</div>
			</div>

			{status.error && (
				<div style={{ color: THEME.danger, marginBottom: '10px' }}>
					⚠️ {status.error}
				</div>
			)}

			<form onSubmit={handleLogin}>
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					style={styles.input}
					required
				/>

				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					style={styles.input}
					required
				/>

				<button
					type="submit"
					disabled={status.loading}
					style={{
						...commonStyles.btn,
						backgroundColor: THEME.primary,
						color: '#fff',
						width: '100%',
					}}
				>
					{status.loading ? 'Signing in...' : 'Sign In'}
				</button>
			</form>
		</div>
	);
};

export default LoginPage;
