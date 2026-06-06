import { useState } from 'react';
import BACKEND_URL from '../backendConfig';
import { THEME } from '../components/CommonStyles';
import { useAuth } from '../context/AuthContext';
import {
	RiUserAddLine,
	RiMailLine,
	RiLockLine,
	RiUserLine,
	RiTimeLine,
	RiAlertLine,
	RiCheckboxCircleLine,
	RiArrowLeftLine,
	RiShieldCheckLine,
	RiEyeLine,
	RiEyeOffLine,
	RiGlobalLine,
	RiCalendarLine,
} from 'react-icons/ri';

const TIMEZONES = [
	{ value: 'Asia/Manila', label: 'Asia/Manila (PHT +8)' },
	{ value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8)' },
	{ value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +9)' },
	{ value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4)' },
	{ value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
	{ value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
	{ value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
	{ value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
	{ value: 'UTC', label: 'UTC (Universal)' },
];

const AccountSetupPage = ({ setView }) => {
	const { user } = useAuth();

	const [form, setForm] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		role: 'employee',
		timezone: 'Asia/Manila',
		scheduleStart: '09:00',
		scheduleEnd: '18:00',
	});

	const [status, setStatus] = useState({ loading: false, error: null, success: false });
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (form.password !== form.confirmPassword) {
			setStatus({ loading: false, error: 'Passwords do not match.', success: false });
			return;
		}
		if (form.password.length < 6) {
			setStatus({ loading: false, error: 'Password must be at least 6 characters.', success: false });
			return;
		}

		setStatus({ loading: true, error: null, success: false });

		try {
			const baseUrl = BACKEND_URL || 'http://localhost:5000';
			const res = await fetch(`${baseUrl}/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
				},
				body: JSON.stringify({
					name: form.name,
					email: form.email,
					password: form.password,
					role: form.role,
					timezone: form.timezone,
					schedule: { start: form.scheduleStart, end: form.scheduleEnd },
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || data.error || 'Registration failed.');

			setStatus({ loading: false, error: null, success: true });
			setForm({
				name: '', email: '', password: '', confirmPassword: '',
				role: 'employee', timezone: 'Asia/Manila',
				scheduleStart: '09:00', scheduleEnd: '18:00',
			});
		} catch (err) {
			setStatus({ loading: false, error: err.message, success: false });
		}
	};

	/* ── shared input field builder ── */
	const Field = ({ label, icon, children }) => (
		<div style={{ marginBottom: '16px' }}>
			<label style={s.label}>{label}</label>
			<div style={{ position: 'relative' }}>
				{icon && <span style={s.inputIcon}>{icon}</span>}
				{children}
			</div>
		</div>
	);

	const inputStyle = (hasIcon = true, extraRight = false) => ({
		width: '100%',
		padding: `10px ${extraRight ? '40px' : '12px'} 10px ${hasIcon ? '36px' : '12px'}`,
		borderRadius: '8px',
		border: '1px solid #e2e8f0',
		fontSize: '14px',
		color: '#0f172a',
		boxSizing: 'border-box',
		outline: 'none',
		fontFamily: "'DM Sans', system-ui, sans-serif",
		backgroundColor: '#fafafa',
		transition: 'border-color 0.15s, box-shadow 0.15s',
	});

	const s = {
		page: {
			minHeight: '100vh',
			backgroundColor: '#f1f5f9',
			display: 'flex',
			alignItems: 'flex-start',
			justifyContent: 'center',
			padding: '40px 24px',
			fontFamily: "'DM Sans', system-ui, sans-serif",
		},
		outer: {
			width: '100%',
			maxWidth: '520px',
		},
		backBtn: {
			display: 'inline-flex', alignItems: 'center', gap: '6px',
			background: 'none', border: 'none',
			color: '#64748b', fontSize: '13px', fontWeight: '600',
			cursor: 'pointer', padding: '0', marginBottom: '20px',
			fontFamily: 'inherit',
		},
		card: {
			backgroundColor: '#ffffff',
			borderRadius: '16px',
			border: '1px solid #e2e8f0',
			overflow: 'hidden',
			boxShadow: '0 4px 24px rgba(15,23,42,0.07)',
		},
		cardHeader: {
			padding: '24px 28px 20px',
			borderBottom: '1px solid #f1f5f9',
			background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
		},
		brandRow: {
			display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
		},
		brandIcon: {
			width: '32px', height: '32px', borderRadius: '8px',
			backgroundColor: THEME.primary ?? '#3b82f6',
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			color: '#fff',
		},
		brandText: {
			fontWeight: '800', fontSize: '14px', letterSpacing: '-0.3px', color: '#0f172a',
		},
		headingRow: {
			display: 'flex', alignItems: 'center', gap: '10px',
		},
		headingIcon: {
			width: '40px', height: '40px', borderRadius: '10px',
			backgroundColor: '#eff6ff',
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			color: THEME.primary ?? '#3b82f6', flexShrink: 0,
		},
		heading: {
			margin: 0, fontSize: '18px', fontWeight: '800',
			letterSpacing: '-0.4px', color: '#0f172a',
		},
		subheading: {
			margin: '2px 0 0', fontSize: '12px', color: '#64748b',
		},
		body: { padding: '24px 28px 28px' },
		label: {
			display: 'block', fontSize: '11px', fontWeight: '700',
			color: '#64748b', marginBottom: '5px',
			letterSpacing: '0.7px', textTransform: 'uppercase',
		},
		inputIcon: {
			position: 'absolute', left: '11px', top: '50%',
			transform: 'translateY(-50%)', color: '#94a3b8',
			pointerEvents: 'none', display: 'flex',
		},
		eyeBtn: {
			position: 'absolute', right: '11px', top: '50%',
			transform: 'translateY(-50%)', background: 'none',
			border: 'none', cursor: 'pointer', color: '#94a3b8',
			display: 'flex', padding: '0',
		},
		sectionDivider: {
			display: 'flex', alignItems: 'center', gap: '10px',
			margin: '20px 0 16px',
		},
		sectionLine: {
			flex: 1, height: '1px', backgroundColor: '#f1f5f9',
		},
		sectionLabel: {
			fontSize: '11px', fontWeight: '700', color: '#94a3b8',
			letterSpacing: '0.8px', textTransform: 'uppercase', whiteSpace: 'nowrap',
		},
		roleGrid: {
			display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
			marginBottom: '16px',
		},
		roleCard: (active) => ({
			padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
			border: active ? `2px solid ${THEME.primary ?? '#3b82f6'}` : '2px solid #e2e8f0',
			backgroundColor: active ? '#eff6ff' : '#fafafa',
			transition: 'all 0.15s',
			display: 'flex', alignItems: 'center', gap: '8px',
		}),
		roleLabel: (active) => ({
			fontSize: '13px', fontWeight: '700',
			color: active ? (THEME.primary ?? '#3b82f6') : '#64748b',
		}),
		roleDesc: {
			fontSize: '11px', color: '#94a3b8', marginTop: '1px',
		},
		shiftBox: {
			backgroundColor: '#f8fafc', borderRadius: '10px',
			border: '1px solid #e2e8f0', padding: '16px',
			display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
		},
		submitBtn: {
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			gap: '8px', width: '100%', padding: '12px',
			backgroundColor: THEME.primary ?? '#3b82f6',
			color: '#fff', border: 'none', borderRadius: '10px',
			fontWeight: '700', fontSize: '14px', cursor: 'pointer',
			marginTop: '20px', letterSpacing: '-0.2px',
			fontFamily: 'inherit', transition: 'opacity 0.15s',
		},
	};

	return (
		<div style={s.page}>
			<div style={s.outer}>
				{/* Back */}
				<button style={s.backBtn} onClick={() => setView('dashboard')}>
					<RiArrowLeftLine size={14} />
					Back to Admin Panel
				</button>

				<div style={s.card}>
					{/* Card Header */}
					<div style={s.cardHeader}>
						<div style={s.brandRow}>
							<div style={s.brandIcon}><RiTimeLine size={15} /></div>
							<span style={s.brandText}>
								WorkTrack <span style={{ color: THEME.primary ?? '#3b82f6' }}>HCM</span>
							</span>
						</div>
						<div style={s.headingRow}>
							<div style={s.headingIcon}><RiUserAddLine size={19} /></div>
							<div>
								<h2 style={s.heading}>Onboard New Employee</h2>
								<p style={s.subheading}>Create a profile and configure their shift schedule</p>
							</div>
						</div>
					</div>

					{/* Body */}
					<div style={s.body}>

						{/* Alerts */}
						{status.error && (
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '9px', fontSize: '13px', marginBottom: '18px' }}>
								<RiAlertLine size={15} style={{ flexShrink: 0 }} />
								{status.error}
							</div>
						)}
						{status.success && (
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '9px', fontSize: '13px', marginBottom: '18px' }}>
								<RiCheckboxCircleLine size={15} style={{ flexShrink: 0 }} />
								Employee account created successfully!{' '}
								<span
									onClick={() => setStatus({ ...status, success: false })}
									style={{ marginLeft: 'auto', cursor: 'pointer', fontWeight: '700', color: '#16a34a' }}
								>
									+ Add another
								</span>
							</div>
						)}

						<form onSubmit={handleSubmit}>
							{/* ── PERSONAL INFO ── */}
							<Field label="Full Name" icon={<RiUserLine size={14} />}>
								<input
									type="text" placeholder="Juan dela Cruz" required
									value={form.name} onChange={set('name')}
									style={inputStyle(true)}
									onFocus={e => { e.target.style.borderColor = THEME.primary ?? '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px #eff6ff'; }}
									onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
								/>
							</Field>

							<Field label="Email Address" icon={<RiMailLine size={14} />}>
								<input
									type="email" placeholder="juan@company.com" required
									value={form.email} onChange={set('email')}
									style={inputStyle(true)}
									onFocus={e => { e.target.style.borderColor = THEME.primary ?? '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px #eff6ff'; }}
									onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
								/>
							</Field>

							{/* Passwords row */}
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
								<div>
									<label style={s.label}>Password</label>
									<div style={{ position: 'relative' }}>
										<span style={s.inputIcon}><RiLockLine size={14} /></span>
										<input
											type={showPassword ? 'text' : 'password'}
											placeholder="••••••••" required
											value={form.password} onChange={set('password')}
											style={{ ...inputStyle(true, true), paddingRight: '38px' }}
											onFocus={e => { e.target.style.borderColor = THEME.primary ?? '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px #eff6ff'; }}
											onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
										/>
										<button type="button" style={s.eyeBtn} onClick={() => setShowPassword(p => !p)}>
											{showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
										</button>
									</div>
								</div>
								<div>
									<label style={s.label}>Confirm</label>
									<div style={{ position: 'relative' }}>
										<span style={s.inputIcon}><RiLockLine size={14} /></span>
										<input
											type={showConfirm ? 'text' : 'password'}
											placeholder="••••••••" required
											value={form.confirmPassword} onChange={set('confirmPassword')}
											style={{ ...inputStyle(true, true), paddingRight: '38px' }}
											onFocus={e => { e.target.style.borderColor = THEME.primary ?? '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px #eff6ff'; }}
											onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
										/>
										<button type="button" style={s.eyeBtn} onClick={() => setShowConfirm(p => !p)}>
											{showConfirm ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
										</button>
									</div>
								</div>
							</div>

							{/* ── ROLE ── */}
							<div style={s.sectionDivider}>
								<div style={s.sectionLine} />
								<span style={s.sectionLabel}>System Role</span>
								<div style={s.sectionLine} />
							</div>

							<div style={s.roleGrid}>
								{[
									{ value: 'employee', label: 'Employee', desc: 'Clock in/out access', icon: <RiUserLine size={15} /> },
									{ value: 'admin', label: 'Administrator', desc: 'Full admin access', icon: <RiShieldCheckLine size={15} /> },
								].map(({ value, label, desc, icon }) => (
									<div
										key={value}
										style={s.roleCard(form.role === value)}
										onClick={() => setForm(p => ({ ...p, role: value }))}
									>
										<span style={{ color: form.role === value ? (THEME.primary ?? '#3b82f6') : '#94a3b8', display: 'flex' }}>{icon}</span>
										<div>
											<div style={s.roleLabel(form.role === value)}>{label}</div>
											<div style={s.roleDesc}>{desc}</div>
										</div>
									</div>
								))}
							</div>

							{/* ── TIMEZONE ── */}
							<div style={s.sectionDivider}>
								<div style={s.sectionLine} />
								<span style={s.sectionLabel}>Region & Schedule</span>
								<div style={s.sectionLine} />
							</div>

							<Field label="Timezone" icon={<RiGlobalLine size={14} />}>
								<select
									value={form.timezone} onChange={set('timezone')}
									style={{ ...inputStyle(true), appearance: 'none', cursor: 'pointer' }}
									onFocus={e => { e.target.style.borderColor = THEME.primary ?? '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px #eff6ff'; }}
									onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
								>
									{TIMEZONES.map(tz => (
										<option key={tz.value} value={tz.value}>{tz.label}</option>
									))}
								</select>
							</Field>

							{/* Shift times */}
							<label style={s.label}>
								<span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
									<RiCalendarLine size={12} />Shift Hours
								</span>
							</label>
							<div style={s.shiftBox}>
								<div>
									<label style={{ ...s.label, marginBottom: '7px' }}>Start Time</label>
									<div style={{ position: 'relative' }}>
										<span style={s.inputIcon}><RiTimeLine size={13} /></span>
										<input
											type="time" required
											value={form.scheduleStart} onChange={set('scheduleStart')}
											style={{ ...inputStyle(true), cursor: 'pointer' }}
											onFocus={e => { e.target.style.borderColor = THEME.primary ?? '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px #eff6ff'; }}
											onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
										/>
									</div>
								</div>
								<div>
									<label style={{ ...s.label, marginBottom: '7px' }}>End Time</label>
									<div style={{ position: 'relative' }}>
										<span style={s.inputIcon}><RiTimeLine size={13} /></span>
										<input
											type="time" required
											value={form.scheduleEnd} onChange={set('scheduleEnd')}
											style={{ ...inputStyle(true), cursor: 'pointer' }}
											onFocus={e => { e.target.style.borderColor = THEME.primary ?? '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px #eff6ff'; }}
											onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
										/>
									</div>
								</div>
							</div>

							{/* Submit */}
							<button
								type="submit"
								disabled={status.loading}
								style={{ ...s.submitBtn, opacity: status.loading ? 0.7 : 1, cursor: status.loading ? 'not-allowed' : 'pointer' }}
							>
								{status.loading
									? 'Creating account…'
									: <><RiUserAddLine size={15} />Provision Employee Account</>
								}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AccountSetupPage;
