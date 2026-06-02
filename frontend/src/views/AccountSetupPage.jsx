import React, { useState } from 'react';
import BACKEND_URL from '../backendConfig';
import { THEME, commonStyles } from '../components/CommonStyles';

const AccountSetupPage = ({ setView }) => {
	// Form state matching Mini HCM user metadata requirements
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		role: 'Employee',      // Default role
		timezone: 'Asia/Manila', // Default fallback timezone
		scheduleStart: '09:00', // Default shift start
		scheduleEnd: '18:00'    // Default shift end
	});

	const [status, setStatus] = useState({ loading: false, error: null, success: false });

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setStatus({ loading: true, error: null, success: false });

		// Structure the payload exactly as the backend expects
		const payload = {
			name: formData.name,
			email: formData.email,
			password: formData.password,
			role: formData.role,
			timezone: formData.timezone,
			schedule: {
				start: formData.scheduleStart,
				end: formData.scheduleEnd
			}
		};

		try {
			const baseUrl = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'http://localhost:5000';
			const response = await fetch(`${baseUrl}/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Registration failed. Please try again.');
			}

			setStatus({ loading: false, error: null, success: true });

			// Clear sensitive fields on success, reset to defaults
			setFormData({
				name: '',
				email: '',
				password: '',
				role: 'Employee',
				timezone: 'Asia/Manila',
				scheduleStart: '09:00',
				scheduleEnd: '18:00'
			});

		} catch (err) {
			setStatus({ loading: false, error: err.message, success: false });
		}
	};

	// Local styling tailored to the Form Layout
	const styles = {
		card: {
			backgroundColor: THEME.surface,
			borderRadius: THEME.radius,
			boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
			width: '100%',
			maxWidth: '480px',
			margin: '40px auto',
			padding: '32px',
			border: `1px solid ${THEME.border}`,
			boxSizing: 'border-box'
		},
		backBtn: {
			background: 'none',
			border: 'none',
			color: THEME.textMuted,
			cursor: 'pointer',
			fontSize: '14px',
			fontWeight: '500',
			padding: '0',
			marginBottom: '20px',
			display: 'inline-flex',
			alignItems: 'center',
			gap: '6px'
		},
		title: {
			fontSize: '24px',
			fontWeight: '700',
			marginBottom: '8px',
			marginTop: '0'
		},
		subtitle: {
			fontSize: '14px',
			color: THEME.textMuted,
			marginBottom: '24px'
		},
		formGroup: {
			marginBottom: '16px',
		},
		row: {
			display: 'flex',
			gap: '12px',
			marginBottom: '16px'
		},
		label: {
			display: 'block',
			fontSize: '14px',
			fontWeight: '500',
			marginBottom: '6px',
		},
		input: {
			width: '100%',
			padding: '10px 14px',
			borderRadius: '6px',
			border: `1px solid ${THEME.border}`,
			fontSize: '14px',
			boxSizing: 'border-box',
			outline: 'none',
		},
		alert: {
			padding: '12px',
			borderRadius: '6px',
			fontSize: '14px',
			marginBottom: '16px',
			fontWeight: '500'
		}
	};

	return (
		<div style={styles.card}>
			{/* Admin Route Back Button */}
			<button style={styles.backBtn} onClick={() => setView('dashboard')}>
				← Back to Admin Panel
			</button>

			<h2 style={styles.title}>Onboard New Employee</h2>
			<p style={styles.subtitle}>Register a new profile and configure their work shift schedule.</p>

			{status.error && (
				<div style={{ ...styles.alert, backgroundColor: '#fef2f2', color: THEME.danger, border: `1px solid ${THEME.danger}33` }}>
					⚠️ {status.error}
				</div>
			)}

			{status.success && (
				<div style={{ ...styles.alert, backgroundColor: '#ecfdf5', color: THEME.success, border: `1px solid ${THEME.success}33` }}>
					🎉 Account successfully registered in Firebase Emulator!
				</div>
			)}

			<form onSubmit={handleSubmit}>
				<div style={styles.formGroup}>
					<label style={styles.label}>Full Name</label>
					<input
						type="text"
						name="name"
						required
						style={styles.input}
						value={formData.name}
						onChange={handleChange}
						placeholder="John Doe"
					/>
				</div>

				<div style={styles.formGroup}>
					<label style={styles.label}>Email Address</label>
					<input
						type="email"
						name="email"
						required
						style={styles.input}
						value={formData.email}
						onChange={handleChange}
						placeholder="john.doe@company.com"
					/>
				</div>

				<div style={styles.formGroup}>
					<label style={styles.label}>Password</label>
					<input
						type="password"
						name="password"
						required
						style={styles.input}
						value={formData.password}
						onChange={handleChange}
						placeholder="••••••••"
					/>
				</div>

				<div style={styles.row}>
					<div style={{ flex: 1 }}>
						<label style={styles.label}>System Role</label>
						<select
							name="role"
							style={styles.input}
							value={formData.role}
							onChange={handleChange}
						>
							<option value="Employee">Employee</option>
							<option value="Admin">Admin</option>
						</select>
					</div>

					<div style={{ flex: 1 }}>
						<label style={styles.label}>Timezone</label>
						<select
							name="timezone"
							style={styles.input}
							value={formData.timezone}
							onChange={handleChange}
						>
							<option value="Asia/Manila">Asia/Manila (PHT)</option>
							<option value="America/New_York">America/New_York (EST)</option>
							<option value="UTC">UTC</option>
						</select>
					</div>
				</div>

				<div style={{ ...styles.formGroup, border: `1px dashed ${THEME.border}`, padding: '12px', borderRadius: '8px' }}>
					<span style={{ ...styles.label, color: THEME.info, marginBottom: '12px' }}>⏱️ Shift Schedule Configuration</span>
					<div style={{ display: 'flex', gap: '12px' }}>
						<div style={{ flex: 1 }}>
							<label style={{ ...styles.label, fontSize: '12px' }}>Shift Start</label>
							<input
								type="time"
								name="scheduleStart"
								required
								style={styles.input}
								value={formData.scheduleStart}
								onChange={handleChange}
							/>
						</div>
						<div style={{ flex: 1 }}>
							<label style={{ ...styles.label, fontSize: '12px' }}>Shift End</label>
							<input
								type="time"
								name="scheduleEnd"
								required
								style={styles.input}
								value={formData.scheduleEnd}
								onChange={handleChange}
							/>
						</div>
					</div>
				</div>

				<button
					type="submit"
					disabled={status.loading}
					style={{
						...commonStyles.btn,
						backgroundColor: THEME.primary,
						color: '#ffffff',
						width: '100%',
						marginTop: '8px',
						opacity: status.loading ? 0.7 : 1,
						cursor: status.loading ? 'not-allowed' : 'pointer'
					}}
				>
					{status.loading ? 'Registering Component...' : 'Provision Account'}
				</button>
			</form>
		</div>
	);
};

export default AccountSetupPage;
