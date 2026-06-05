import React from 'react';
import {
	RiTimeLine,
	RiShieldCheckLine,
	RiBarChartBoxLine,
	RiTeamLine,
	RiArrowRightLine,
	RiLogoutBoxLine,
	RiUserLine,
	RiCalendarCheckLine,
	RiMapPinTimeLine,
} from 'react-icons/ri';

const THEME = {
	bg: '#f8fafc',
	surface: '#ffffff',
	text: '#0f172a',
	textMuted: '#64748b',
	primary: '#2563eb',
	primaryHover: '#1d4ed8',
	success: '#10b981',
	border: '#e2e8f0',
	radius: '12px',
};

const LandingPage = ({ setView, user, onLogout }) => {
	const features = [
		{
			icon: <RiMapPinTimeLine size={24} />,
			title: 'Clock In / Out',
			desc: 'One-tap punch tracking with live shift timer and real-time elapsed tracking.',
			color: '#eff6ff',
			accent: THEME.primary,
		},
		{
			icon: <RiBarChartBoxLine size={24} />,
			title: 'Attendance Analytics',
			desc: 'Detailed breakdowns of regular hours, overtime, night differential, and more.',
			color: '#f0fdf4',
			accent: THEME.success,
		},
		{
			icon: <RiCalendarCheckLine size={24} />,
			title: 'Shift Management',
			desc: 'Assign custom schedules and timezone-aware shift windows per employee.',
			color: '#faf5ff',
			accent: '#7c3aed',
		},
		{
			icon: <RiShieldCheckLine size={24} />,
			title: 'Admin Controls',
			desc: 'Manage employee profiles, review punch logs, and edit time records with audit trails.',
			color: '#fff7ed',
			accent: '#ea580c',
		},
	];

	return (
		<div
			style={{
				minHeight: '100vh',
				backgroundColor: THEME.bg,
				fontFamily: "'Inter', system-ui, sans-serif",
				color: THEME.text,
			}}
		>
			{/* ─── HEADER / NAV ─── */}
			<header
				style={{
					backgroundColor: THEME.surface,
					borderBottom: `1px solid ${THEME.border}`,
					padding: '0 40px',
					height: '64px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					position: 'sticky',
					top: 0,
					zIndex: 100,
				}}
			>
				{/* Brand */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					<div
						style={{
							width: '32px',
							height: '32px',
							borderRadius: '8px',
							backgroundColor: THEME.primary,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: '#fff',
						}}
					>
						<RiTimeLine size={18} />
					</div>
					<span style={{ fontWeight: '700', fontSize: '16px', letterSpacing: '-0.3px' }}>
						WorkTrack <span style={{ color: THEME.primary }}>HCM</span>
					</span>
				</div>

				{/* Nav Actions */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
					{user ? (
						<>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									padding: '6px 14px',
									backgroundColor: '#f1f5f9',
									borderRadius: '8px',
									fontSize: '13px',
									fontWeight: '500',
									color: THEME.textMuted,
								}}
							>
								<RiUserLine size={15} />
								{user.name || user.email || 'User'}
							</div>
							<button
								onClick={() => setView(user.role === 'admin' ? 'dashboard' : 'dashboard')}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '6px',
									padding: '8px 16px',
									backgroundColor: THEME.primary,
									color: '#fff',
									border: 'none',
									borderRadius: '8px',
									fontWeight: '600',
									fontSize: '13px',
									cursor: 'pointer',
								}}
							>
								Go to Dashboard
								<RiArrowRightLine size={15} />
							</button>
							<button
								onClick={onLogout}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '6px',
									padding: '8px 14px',
									backgroundColor: 'transparent',
									color: '#e53e3e',
									border: '1px solid #fed7d7',
									borderRadius: '8px',
									fontWeight: '600',
									fontSize: '13px',
									cursor: 'pointer',
								}}
							>
								<RiLogoutBoxLine size={15} />
								Logout
							</button>
						</>
					) : (
						<>
							<button
								onClick={() => setView('login')}
								style={{
									padding: '8px 18px',
									backgroundColor: 'transparent',
									color: THEME.text,
									border: `1px solid ${THEME.border}`,
									borderRadius: '8px',
									fontWeight: '600',
									fontSize: '13px',
									cursor: 'pointer',
								}}
							>
								Sign In
							</button>
							<button
								onClick={() => setView('register')}
								style={{
									padding: '8px 18px',
									backgroundColor: THEME.primary,
									color: '#fff',
									border: 'none',
									borderRadius: '8px',
									fontWeight: '600',
									fontSize: '13px',
									cursor: 'pointer',
								}}
							>
								Get Started
							</button>
						</>
					)}
				</div>
			</header>

			{/* ─── HERO ─── */}
			<section
				style={{
					maxWidth: '880px',
					margin: '0 auto',
					padding: '80px 24px 64px',
					textAlign: 'center',
				}}
			>
				<div
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: '6px',
						backgroundColor: '#eff6ff',
						color: THEME.primary,
						padding: '5px 14px',
						borderRadius: '999px',
						fontSize: '12px',
						fontWeight: '600',
						marginBottom: '24px',
						letterSpacing: '0.4px',
						textTransform: 'uppercase',
					}}
				>
					<RiTeamLine size={14} />
					Human Capital Management
				</div>

				<h1
					style={{
						fontSize: 'clamp(32px, 5vw, 52px)',
						fontWeight: '800',
						lineHeight: '1.15',
						letterSpacing: '-1px',
						margin: '0 0 20px',
					}}
				>
					Workforce time tracking,{' '}
					<span style={{ color: THEME.primary }}>done right.</span>
				</h1>

				<p
					style={{
						fontSize: '17px',
						color: THEME.textMuted,
						lineHeight: '1.7',
						maxWidth: '560px',
						margin: '0 auto 36px',
					}}
				>
					A streamlined platform for clocking in, monitoring shift metrics, managing attendance,
					and generating payroll-ready reports — built for Philippine labor standards.
				</p>

				{!user && (
					<div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
						<button
							onClick={() => setView('login')}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '8px',
								padding: '13px 28px',
								backgroundColor: THEME.primary,
								color: '#fff',
								border: 'none',
								borderRadius: '10px',
								fontWeight: '700',
								fontSize: '15px',
								cursor: 'pointer',
								letterSpacing: '-0.2px',
							}}
						>
							Sign In to Portal
							<RiArrowRightLine size={18} />
						</button>
						<button
							onClick={() => setView('register')}
							style={{
								padding: '13px 28px',
								backgroundColor: THEME.surface,
								color: THEME.text,
								border: `1px solid ${THEME.border}`,
								borderRadius: '10px',
								fontWeight: '600',
								fontSize: '15px',
								cursor: 'pointer',
							}}
						>
							Create Account
						</button>
					</div>
				)}
			</section>

			{/* ─── FEATURE CARDS ─── */}
			<section
				style={{
					maxWidth: '1000px',
					margin: '0 auto',
					padding: '0 24px 80px',
				}}
			>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
						gap: '16px',
					}}
				>
					{features.map((f) => (
						<div
							key={f.title}
							style={{
								backgroundColor: THEME.surface,
								border: `1px solid ${THEME.border}`,
								borderRadius: '12px',
								padding: '24px',
							}}
						>
							<div
								style={{
									width: '44px',
									height: '44px',
									borderRadius: '10px',
									backgroundColor: f.color,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: f.accent,
									marginBottom: '16px',
								}}
							>
								{f.icon}
							</div>
							<h3
								style={{
									margin: '0 0 8px',
									fontSize: '15px',
									fontWeight: '700',
									letterSpacing: '-0.2px',
								}}
							>
								{f.title}
							</h3>
							<p
								style={{
									margin: 0,
									fontSize: '13px',
									color: THEME.textMuted,
									lineHeight: '1.6',
								}}
							>
								{f.desc}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* ─── FOOTER ─── */}
			<footer
				style={{
					borderTop: `1px solid ${THEME.border}`,
					padding: '20px 40px',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					fontSize: '12px',
					color: THEME.textMuted,
				}}
			>
				<span>WorkTrack HCM © {new Date().getFullYear()}</span>
				<span>Built for Philippine labor standards · Asia/Manila</span>
			</footer>
		</div>
	);
};

export default LandingPage;
