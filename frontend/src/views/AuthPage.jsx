import { useState, useEffect } from 'react';
import { THEME } from '../components/CommonStyles';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
	RiMailLine,
	RiLockLine,
	RiUserLine,
	RiTimeLine,
	RiAlertLine,
	RiCheckboxCircleLine,
	RiArrowRightLine,
	RiArrowLeftLine,
	RiShieldCheckLine,
} from 'react-icons/ri';

const AuthPage = ({ setView, initialTab = 'login' }) => {
	const { setUser } = useAuth();
	const [activeTab, setActiveTab] = useState(initialTab);
	const [animating, setAnimating] = useState(false);
	const [slideDir, setSlideDir] = useState('right');

	// Login state
	const [loginForm, setLoginForm] = useState({ email: '', password: '' });
	const [loginStatus, setLoginStatus] = useState({ loading: false, error: null });

	// Register state
	const [regForm, setRegForm] = useState({
		name: '', email: '', password: '',
		role: 'employee', timezone: 'Asia/Manila',
		start: '09:00', end: '18:00',
	});
	const [regStatus, setRegStatus] = useState({ loading: false, error: null, success: null });

	const switchTab = (tab) => {
		if (tab === activeTab || animating) return;
		setSlideDir(tab === 'register' ? 'left' : 'right');
		setAnimating(true);
		setTimeout(() => {
			setActiveTab(tab);
			setAnimating(false);
		}, 220);
	};

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoginStatus({ loading: true, error: null });
		try {
			await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
			setView('dashboard');
		} catch (err) {
			setLoginStatus({ loading: false, error: err.message });
		}
	};

	const handleRegister = async (e) => {
		e.preventDefault();
		setRegStatus({ loading: true, error: null, success: null });
		try {
			const userCred = await createUserWithEmailAndPassword(auth, regForm.email, regForm.password);
			const user = userCred.user;
			await updateProfile(user, { displayName: regForm.name });
			await setDoc(doc(db, 'users', user.uid), {
				uid: user.uid,
				name: regForm.name,
				email: regForm.email,
				role: regForm.role,
				timezone: regForm.timezone,
				schedule: { start: regForm.start, end: regForm.end },
				createdAt: new Date().toISOString(),
			});
			setRegStatus({ loading: false, error: null, success: 'Account created!' });
			setTimeout(() => switchTab('login'), 1200);
		} catch (err) {
			setRegStatus({ loading: false, error: err.message, success: null });
		}
	};

	const slideStyle = animating
		? {
			opacity: 0,
			transform: slideDir === 'left' ? 'translateX(-18px)' : 'translateX(18px)',
			transition: 'opacity 0.22s ease, transform 0.22s ease',
		}
		: {
			opacity: 1,
			transform: 'translateX(0)',
			transition: 'opacity 0.22s ease, transform 0.22s ease',
		};

	const s = {
		page: {
			minHeight: '100vh',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: THEME.bg,
			padding: '24px',
			fontFamily: "'Inter', system-ui, sans-serif",
		},
		card: {
			backgroundColor: '#fff',
			borderRadius: '16px',
			border: '1px solid #e2e8f0',
			width: '100%',
			maxWidth: '420px',
			overflow: 'hidden',
		},
		header: {
			padding: '28px 32px 0',
		},
		brand: {
			display: 'flex',
			alignItems: 'center',
			gap: '8px',
			marginBottom: '24px',
		},
		brandIcon: {
			width: '30px', height: '30px',
			borderRadius: '7px',
			backgroundColor: THEME.primary,
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			color: '#fff',
		},
		brandText: {
			fontWeight: '700', fontSize: '14px', letterSpacing: '-0.2px',
		},
		tabRow: {
			display: 'flex',
			backgroundColor: '#f1f5f9',
			borderRadius: '10px',
			padding: '4px',
			gap: '4px',
			marginBottom: '24px',
		},
		tab: (active) => ({
			flex: 1,
			padding: '8px',
			border: 'none',
			borderRadius: '7px',
			backgroundColor: active ? '#fff' : 'transparent',
			color: active ? THEME.text : THEME.textMuted,
			fontWeight: active ? '700' : '500',
			fontSize: '13px',
			cursor: 'pointer',
			transition: 'all 0.18s ease',
			boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
		}),
		body: {
			padding: '0 32px 32px',
		},
		label: {
			display: 'block',
			fontSize: '12px',
			fontWeight: '600',
			color: THEME.textMuted,
			marginBottom: '5px',
			letterSpacing: '0.3px',
			textTransform: 'uppercase',
		},
		inputWrap: {
			position: 'relative',
			marginBottom: '14px',
		},
		inputIcon: {
			position: 'absolute',
			left: '12px',
			top: '50%',
			transform: 'translateY(-50%)',
			color: '#94a3b8',
			pointerEvents: 'none',
			display: 'flex',
		},
		input: {
			width: '100%',
			padding: '10px 12px 10px 36px',
			borderRadius: '8px',
			border: '1px solid #e2e8f0',
			fontSize: '14px',
			color: THEME.text,
			boxSizing: 'border-box',
			outline: 'none',
			fontFamily: 'inherit',
			backgroundColor: '#fafafa',
			transition: 'border-color 0.15s',
		},
		inputPlain: {
			width: '100%',
			padding: '10px 12px',
			borderRadius: '8px',
			border: '1px solid #e2e8f0',
			fontSize: '14px',
			color: THEME.text,
			boxSizing: 'border-box',
			outline: 'none',
			fontFamily: 'inherit',
			backgroundColor: '#fafafa',
		},
		row: { display: 'flex', gap: '10px' },
		btn: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			gap: '7px',
			width: '100%',
			padding: '11px',
			backgroundColor: THEME.primary,
			color: '#fff',
			border: 'none',
			borderRadius: '9px',
			fontWeight: '700',
			fontSize: '14px',
			cursor: 'pointer',
			marginTop: '6px',
			letterSpacing: '-0.1px',
			transition: 'opacity 0.15s',
		},
		alert: (type) => ({
			display: 'flex',
			alignItems: 'center',
			gap: '8px',
			padding: '10px 14px',
			borderRadius: '8px',
			fontSize: '13px',
			marginBottom: '14px',
			backgroundColor: type === 'error' ? '#fff5f5' : '#f0fdf4',
			color: type === 'error' ? '#c53030' : '#166534',
			border: `1px solid ${type === 'error' ? '#fed7d7' : '#bbf7d0'}`,
		}),
		divider: {
			borderTop: '1px solid #f1f5f9',
			margin: '18px 0',
		},
		link: {
			textAlign: 'center',
			fontSize: '13px',
			color: THEME.textMuted,
			marginTop: '16px',
		},
	};

	return (
		<div style={s.page}>
			<div style={s.card}>
				{/* Header */}
				<div style={s.header}>
					<div style={s.brand}>
						<div style={s.brandIcon}><RiTimeLine size={16} /></div>
						<span style={s.brandText}>
							WorkTrack <span style={{ color: THEME.primary }}>HCM</span>
						</span>
						<button
							onClick={() => setView('landing')}
							style={{
								marginLeft: 'auto',
								display: 'flex',
								alignItems: 'center',
								gap: '5px',
								padding: '5px 12px',
								backgroundColor: 'transparent',
								color: THEME.textMuted,
								border: '1px solid #e2e8f0',
								borderRadius: '7px',
								fontSize: '12px',
								fontWeight: '600',
								cursor: 'pointer',
								fontFamily: 'inherit',
							}}
						>
							<RiArrowLeftLine size={13} />
							Back
						</button>
					</div>

					{/* Tab switcher */}
					<div style={s.tabRow}>
						<button style={s.tab(activeTab === 'login')} onClick={() => switchTab('login')}>
							Sign In
						</button>
						<button style={s.tab(activeTab === 'register')} onClick={() => switchTab('register')}>
							Create Account
						</button>
					</div>
				</div>

				{/* Animated body */}
				<div style={{ ...s.body, ...slideStyle }}>

					{/* ── LOGIN FORM ── */}
					{activeTab === 'login' && (
						<>
							<p style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', margin: '0 0 4px' }}>
								Welcome back
							</p>
							<p style={{ fontSize: '13px', color: THEME.textMuted, margin: '0 0 20px' }}>
								Sign in to your employee portal
							</p>

							{loginStatus.error && (
								<div style={s.alert('error')}>
									<RiAlertLine size={15} />
									{loginStatus.error}
								</div>
							)}

							<form onSubmit={handleLogin}>
								<label style={s.label}>Email</label>
								<div style={s.inputWrap}>
									<span style={s.inputIcon}><RiMailLine size={15} /></span>
									<input
										type="email"
										placeholder="you@company.com"
										value={loginForm.email}
										onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
										style={s.input}
										required
									/>
								</div>

								<label style={s.label}>Password</label>
								<div style={s.inputWrap}>
									<span style={s.inputIcon}><RiLockLine size={15} /></span>
									<input
										type="password"
										placeholder="••••••••"
										value={loginForm.password}
										onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
										style={s.input}
										required
									/>
								</div>

								<button type="submit" disabled={loginStatus.loading} style={{ ...s.btn, opacity: loginStatus.loading ? 0.7 : 1 }}>
									{loginStatus.loading ? 'Signing in…' : (<>Sign In <RiArrowRightLine size={15} /></>)}
								</button>
							</form>

							<div style={s.link}>
								No account?{' '}
								<span onClick={() => switchTab('register')} style={{ color: THEME.primary, fontWeight: '600', cursor: 'pointer' }}>
									Create one
								</span>
							</div>
						</>
					)}

					{/* ── REGISTER FORM ── */}
					{activeTab === 'register' && (
						<>
							<p style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', margin: '0 0 4px' }}>
								Create account
							</p>
							<p style={{ fontSize: '13px', color: THEME.textMuted, margin: '0 0 20px' }}>
								Set up a new employee profile
							</p>

							{regStatus.error && (
								<div style={s.alert('error')}>
									<RiAlertLine size={15} />
									{regStatus.error}
								</div>
							)}
							{regStatus.success && (
								<div style={s.alert('success')}>
									<RiCheckboxCircleLine size={15} />
									{regStatus.success}
								</div>
							)}

							<form onSubmit={handleRegister}>
								<label style={s.label}>Full Name</label>
								<div style={s.inputWrap}>
									<span style={s.inputIcon}><RiUserLine size={15} /></span>
									<input
										name="name" placeholder="Juan dela Cruz"
										value={regForm.name}
										onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
										style={s.input} required
									/>
								</div>

								<label style={s.label}>Email</label>
								<div style={s.inputWrap}>
									<span style={s.inputIcon}><RiMailLine size={15} /></span>
									<input
										name="email" type="email" placeholder="you@company.com"
										value={regForm.email}
										onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
										style={s.input} required
									/>
								</div>

								<label style={s.label}>Password</label>
								<div style={s.inputWrap}>
									<span style={s.inputIcon}><RiLockLine size={15} /></span>
									<input
										name="password" type="password" placeholder="••••••••"
										value={regForm.password}
										onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
										style={s.input} required
									/>
								</div>

								<div style={s.row}>
									<div style={{ flex: 1 }}>
										<label style={s.label}>Role</label>
										<select
											name="role" value={regForm.role}
											onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
											style={{ ...s.inputPlain, marginBottom: '14px' }}
										>
											<option value="employee">Employee</option>
											<option value="admin">Admin</option>
										</select>
									</div>
									<div style={{ flex: 1 }}>
										<label style={s.label}>Timezone</label>
										<input
											name="timezone" value={regForm.timezone}
											onChange={(e) => setRegForm({ ...regForm, timezone: e.target.value })}
											style={{ ...s.inputPlain, marginBottom: '14px' }}
										/>
									</div>
								</div>

								<div style={{ ...s.row }}>
									<div style={{ flex: 1 }}>
										<label style={s.label}>Shift Start</label>
										<div style={s.inputWrap}>
											<span style={s.inputIcon}><RiTimeLine size={15} /></span>
											<input
												name="start" type="time" value={regForm.start}
												onChange={(e) => setRegForm({ ...regForm, start: e.target.value })}
												style={s.input}
											/>
										</div>
									</div>
									<div style={{ flex: 1 }}>
										<label style={s.label}>Shift End</label>
										<div style={s.inputWrap}>
											<span style={s.inputIcon}><RiTimeLine size={15} /></span>
											<input
												name="end" type="time" value={regForm.end}
												onChange={(e) => setRegForm({ ...regForm, end: e.target.value })}
												style={s.input}
											/>
										</div>
									</div>
								</div>

								<button type="submit" disabled={regStatus.loading} style={{ ...s.btn, opacity: regStatus.loading ? 0.7 : 1 }}>
									{regStatus.loading ? 'Creating account…' : (<><RiShieldCheckLine size={15} /> Create Account</>)}
								</button>
							</form>

							<div style={s.link}>
								Already have an account?{' '}
								<span onClick={() => switchTab('login')} style={{ color: THEME.primary, fontWeight: '600', cursor: 'pointer' }}>
									Sign in
								</span>
							</div>
						</>
					)}

				</div>
			</div>
		</div>
	);
};

export default AuthPage;
