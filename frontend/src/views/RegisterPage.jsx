import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { db } from '../firebase'; // you'll need to export firestore too
import { THEME, commonStyles } from '../components/CommonStyles';

const RegisterPage = ({ setView }) => {
	const [form, setForm] = useState({
		name: '',
		email: '',
		password: '',
		role: 'employee',
		timezone: 'Asia/Manila',
		start: '09:00',
		end: '18:00',
	});

	const [status, setStatus] = useState({ loading: false, error: null, success: null });

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleRegister = async (e) => {
		e.preventDefault();
		setStatus({ loading: true, error: null, success: null });

		try {
			// 1. Create user in Firebase Auth
			const userCred = await createUserWithEmailAndPassword(
				auth,
				form.email,
				form.password
			);

			const user = userCred.user;

			// 2. Set display name
			await updateProfile(user, {
				displayName: form.name,
			});

			// 3. Store extra data in Firestore
			await setDoc(doc(db, 'users', user.uid), {
				uid: user.uid,
				name: form.name,
				email: form.email,
				role: form.role,
				timezone: form.timezone,
				schedule: {
					start: form.start,
					end: form.end,
				},
				createdAt: new Date().toISOString(),
			});

			setStatus({
				loading: false,
				error: null,
				success: 'Account created successfully!',
			});

			setTimeout(() => setView('login'), 1200);

		} catch (err) {
			setStatus({
				loading: false,
				error: err.message,
				success: null,
			});
		}
	};

	const styles = {
		card: {
			backgroundColor: THEME.surface,
			borderRadius: THEME.radius,
			maxWidth: '450px',
			margin: '60px auto',
			padding: '32px',
			border: `1px solid ${THEME.border}`,
		},
		input: {
			width: '100%',
			padding: '10px',
			borderRadius: '6px',
			border: `1px solid ${THEME.border}`,
			marginBottom: '12px',
			boxSizing: 'border-box',
		},
		row: { display: 'flex', gap: '10px' },
	};

	return (
		<div style={styles.card}>
			<h2>Create Account</h2>

			{status.error && <div style={{ color: THEME.danger }}>{status.error}</div>}
			{status.success && <div style={{ color: 'green' }}>{status.success}</div>}

			<form onSubmit={handleRegister}>
				<input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} style={styles.input} />
				<input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} style={styles.input} />
				<input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} style={styles.input} />

				<div style={styles.row}>
					<select name="role" value={form.role} onChange={handleChange} style={styles.input}>
						<option value="employee">Employee</option>
						<option value="admin">Admin</option>
					</select>

					<input name="timezone" value={form.timezone} onChange={handleChange} style={styles.input} />
				</div>

				<div style={styles.row}>
					<input name="start" type="time" value={form.start} onChange={handleChange} style={styles.input} />
					<input name="end" type="time" value={form.end} onChange={handleChange} style={styles.input} />
				</div>

				<button type="submit" style={{ ...commonStyles.btn, width: '100%' }}>
					{status.loading ? 'Creating...' : 'Register'}
				</button>
			</form>

			<p onClick={() => setView('login')} style={{ cursor: 'pointer', color: THEME.primary }}>
				Already have an account? Login
			</p>
		</div>
	);
};

export default RegisterPage;
