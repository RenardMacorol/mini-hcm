import React, { useState, useEffect } from 'react';
import BACKEND_URL from '../backendConfig';
import { THEME, commonStyles } from '../components/CommonStyles';
import { useAuth } from '../context/AuthContext';
import {
	RiTimeLine,
	RiLogoutBoxLine,
	RiUserLine,
	RiCalendar2Line,
	RiGpsLine,
	RiBarChartBoxLine,
	RiHistoryLine,
	RiAlertLine,
	RiClockwiseLine,
	RiMoonLine,
	RiTimerLine,
	RiArrowDownSLine,
} from 'react-icons/ri';

const EmployeeDashboard = ({ onLogout, setView }) => {
	const API = (path) => `${BACKEND_URL}${path}`;
	const { user } = useAuth();
	const token = user?.token;

	const [punchStatus, setPunchStatus] = useState('OUT');
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [historyLogs, setHistoryLogs] = useState([]);

	const [currentTime, setCurrentTime] = useState(new Date());
	const [punchInTime, setPunchInTime] = useState(null);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	const [summaryMetrics, setSummaryMetrics] = useState({
		regularHours: 0,
		overtimeHours: 0,
		nightDiffHours: 0,
		latenessMinutes: 0,
		undertimeMinutes: 0,
	});

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		let interval;
		if (punchStatus === 'IN' && punchInTime) {
			interval = setInterval(() => {
				const now = new Date();
				const difference = Math.floor((now - punchInTime) / 1000);
				setElapsedSeconds(difference >= 0 ? difference : 0);
			}, 1000);
		} else {
			setElapsedSeconds(0);
		}
		return () => clearInterval(interval);
	}, [punchStatus, punchInTime]);

	const formatElapsedTime = (totalSeconds) => {
		const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
		const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
		const secs = String(totalSeconds % 60).padStart(2, '0');
		return `${hrs}:${mins}:${secs}`;
	};

	const fetchSummaryHistory = async () => {
		if (!user?.token) return;
		try {
			setFetching(true);
			setErrorMessage('');
			const response = await fetch(API('/api/attendance/my-summary'), {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${user.token}`,
				},
			});
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				throw new Error(`Server returned non-JSON response (Status: ${response.status})`);
			}
			const resData = await response.json();
			if (!response.ok) throw new Error(resData.error || 'Failed to sync metrics from server.');
			if (resData.status === 'success' && resData.data) {
				const logs = resData.data;
				setHistoryLogs(logs);
				const totals = logs.reduce(
					(acc, doc) => ({
						regularHours: acc.regularHours + (doc.regularHours || 0),
						overtimeHours: acc.overtimeHours + (doc.overtimeHours || 0),
						nightDiffHours: acc.nightDiffHours + (doc.nightDiffHours || 0),
						latenessMinutes: acc.latenessMinutes + (doc.latenessMinutes || 0),
						undertimeMinutes: acc.undertimeMinutes + (doc.undertimeMinutes || 0),
					}),
					{ regularHours: 0, overtimeHours: 0, nightDiffHours: 0, latenessMinutes: 0, undertimeMinutes: 0 }
				);
				setSummaryMetrics(totals);
			}
		} catch (err) {
			setErrorMessage(err.message);
		} finally {
			setFetching(false);
		}
	};

	useEffect(() => {
		fetchSummaryHistory();
	}, [user?.token]);

	const handlePunchToggle = async () => {
		setLoading(true);
		setErrorMessage('');
		const nextType = punchStatus === 'OUT' ? 'IN' : 'OUT';
		try {
			const response = await fetch(API('/api/attendance/punch'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${user.token}`,
				},
				body: JSON.stringify({ type: nextType }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || 'An error occurred processing the time stamp.');
			setPunchStatus(nextType);
			if (nextType === 'IN') {
				setPunchInTime(new Date());
			} else {
				setPunchInTime(null);
			}
			await fetchSummaryHistory();
		} catch (err) {
			setErrorMessage(err.message);
		} finally {
			setLoading(false);
		}
	};

	const metrics = [
		{
			label: 'Regular Hours',
			value: `${summaryMetrics.regularHours.toFixed(2)}h`,
			icon: <RiTimeLine size={18} />,
			bg: '#f0fdf4',
			color: THEME.success,
		},
		{
			label: 'Overtime',
			value: `${summaryMetrics.overtimeHours.toFixed(2)}h`,
			icon: <RiClockwiseLine size={18} />,
			bg: '#eff6ff',
			color: THEME.info,
		},
		{
			label: 'Night Differential',
			value: `${summaryMetrics.nightDiffHours.toFixed(2)}h`,
			icon: <RiMoonLine size={18} />,
			bg: '#faf5ff',
			color: '#7c3aed',
		},
		{
			label: 'Late (mins)',
			value: `${summaryMetrics.latenessMinutes}m`,
			icon: <RiAlertLine size={18} />,
			bg: '#fff5f5',
			color: '#c53030',
		},
		{
			label: 'Undertime (mins)',
			value: `${summaryMetrics.undertimeMinutes}m`,
			icon: <RiArrowDownSLine size={18} />,
			bg: '#fffaf0',
			color: '#dd6b20',
		},
	];

	const s = {
		page: {
			maxWidth: '960px',
			margin: '32px auto',
			padding: '0 24px',
			fontFamily: "'Inter', system-ui, sans-serif",
		},
		card: {
			backgroundColor: '#ffffff',
			borderRadius: '12px',
			padding: '28px',
			border: '1px solid #e2e8f0',
			marginBottom: '20px',
		},
		sectionLabel: {
			fontSize: '11px',
			fontWeight: '700',
			letterSpacing: '0.8px',
			textTransform: 'uppercase',
			color: THEME.textMuted,
			marginBottom: '12px',
		},
		shiftBox: {
			backgroundColor: '#f8fafc',
			padding: '16px 20px',
			borderRadius: '8px',
			border: '1px solid #e2e8f0',
			borderLeft: `3px solid ${THEME.info}`,
		},
		th: {
			padding: '10px 14px',
			fontSize: '11px',
			fontWeight: '700',
			letterSpacing: '0.6px',
			textTransform: 'uppercase',
			color: THEME.textMuted,
			backgroundColor: '#f8fafc',
			borderBottom: '1px solid #e2e8f0',
			textAlign: 'left',
		},
		td: {
			padding: '12px 14px',
			fontSize: '13px',
			borderBottom: '1px solid #f1f5f9',
			color: THEME.text,
		},
	};

	return (
		<div style={s.page}>
			{errorMessage && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '12px 16px',
						backgroundColor: '#fff5f5',
						color: '#c53030',
						borderRadius: '8px',
						marginBottom: '16px',
						fontSize: '13px',
						border: '1px solid #fed7d7',
					}}
				>
					<RiAlertLine size={16} />
					{errorMessage}
				</div>
			)}

			{/* ─── PROFILE + PUNCH CARD ─── */}
			<div style={s.card}>
				{/* Header row */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						marginBottom: '24px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
						<div
							style={{
								width: '46px',
								height: '46px',
								borderRadius: '50%',
								backgroundColor: '#eff6ff',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: THEME.primary,
								fontWeight: '700',
								fontSize: '16px',
							}}
						>
							{user.name ? user.name.charAt(0).toUpperCase() : <RiUserLine size={20} />}
						</div>
						<div>
							<h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' }}>
								{user.name || 'Employee'}
							</h2>
							<p style={{ margin: '2px 0 0', fontSize: '13px', color: THEME.textMuted }}>
								Employee Portal
							</p>
						</div>
					</div>
					<button
						onClick={onLogout}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							padding: '7px 14px',
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
				</div>

				{/* Shift Info */}
				<p style={s.sectionLabel}>Assigned Shift</p>
				<div style={s.shiftBox}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
						<RiCalendar2Line size={15} color={THEME.info} />
						<span style={{ fontSize: '13px', fontWeight: '600', color: THEME.textMuted }}>
							Timezone: {user.timezone || 'Asia/Manila'}
						</span>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<RiTimeLine size={15} color={THEME.info} />
						<span style={{ fontSize: '14px' }}>
							Shift:{' '}
							<strong>{user.schedule?.start || 'N/A'}</strong>
							{' — '}
							<strong>{user.schedule?.end || 'N/A'}</strong>
						</span>
					</div>
				</div>

				{/* Punch Button */}
				<div style={{ marginTop: '24px' }}>
					<button
						onClick={handlePunchToggle}
						disabled={loading}
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '10px',
							width: '100%',
							padding: '14px',
							backgroundColor: punchStatus === 'OUT' ? THEME.success : '#e53e3e',
							color: '#fff',
							border: 'none',
							borderRadius: '10px',
							fontWeight: '700',
							fontSize: '15px',
							cursor: loading ? 'not-allowed' : 'pointer',
							opacity: loading ? 0.7 : 1,
							letterSpacing: '-0.2px',
						}}
					>
						<RiGpsLine size={18} />
						{loading ? 'Processing…' : punchStatus === 'OUT' ? 'Clock In' : 'Clock Out'}
					</button>

					{/* Live time row */}
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							gap: '20px',
							marginTop: '14px',
							fontSize: '13px',
							color: THEME.textMuted,
						}}
					>
						<span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
							<RiTimeLine size={14} />
							{currentTime.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' })}
						</span>
						{punchStatus === 'IN' && (
							<span
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '5px',
									fontWeight: '700',
									color: THEME.success,
								}}
							>
								<RiTimerLine size={14} />
								Running: {formatElapsedTime(elapsedSeconds)}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* ─── METRICS GRID ─── */}
			<div style={{ marginBottom: '8px' }}>
				<p style={{ ...s.sectionLabel, marginBottom: '14px' }}>
					<RiBarChartBoxLine
						size={12}
						style={{ verticalAlign: 'middle', marginRight: '5px' }}
					/>
					30-Day Period Summary
				</p>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
						gap: '12px',
						marginBottom: '24px',
					}}
				>
					{metrics.map((m) => (
						<div
							key={m.label}
							style={{
								backgroundColor: m.bg,
								borderRadius: '10px',
								padding: '16px',
								border: '1px solid #f1f5f9',
								display: 'flex',
								flexDirection: 'column',
								gap: '6px',
							}}
						>
							<div style={{ color: m.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
								{m.icon}
								<span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
									{m.label}
								</span>
							</div>
							<span style={{ fontSize: '22px', fontWeight: '800', color: m.color, letterSpacing: '-0.5px' }}>
								{m.value}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* ─── HISTORY TABLE ─── */}
			<div style={s.card}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
					<RiHistoryLine size={17} color={THEME.textMuted} />
					<h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Daily Attendance History</h3>
				</div>
				<div style={{ overflowX: 'auto' }}>
					{fetching ? (
						<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '32px 0', fontSize: '14px' }}>
							Syncing records…
						</p>
					) : historyLogs.length === 0 ? (
						<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '32px 0', fontSize: '14px' }}>
							No attendance records found for this period.
						</p>
					) : (
						<table style={{ width: '100%', borderCollapse: 'collapse' }}>
							<thead>
								<tr>
									{['Date', 'Regular', 'Overtime', 'Night Diff', 'Late', 'Undertime'].map((col) => (
										<th key={col} style={s.th}>{col}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{historyLogs.map((log) => (
									<tr key={log.id} style={{ transition: 'background 0.1s' }}>
										<td style={{ ...s.td, fontWeight: '600' }}>{log.date}</td>
										<td style={s.td}>{log.regularHours?.toFixed(2) || '0.00'}h</td>
										<td style={{ ...s.td, color: log.overtimeHours > 0 ? THEME.info : THEME.textMuted }}>
											{log.overtimeHours?.toFixed(2) || '0.00'}h
										</td>
										<td style={{ ...s.td, color: log.nightDiffHours > 0 ? '#7c3aed' : THEME.textMuted }}>
											{log.nightDiffHours?.toFixed(2) || '0.00'}h
										</td>
										<td style={{ ...s.td, color: log.latenessMinutes > 0 ? '#c53030' : THEME.textMuted }}>
											{log.latenessMinutes || 0}m
										</td>
										<td style={{ ...s.td, color: log.undertimeMinutes > 0 ? '#dd6b20' : THEME.textMuted }}>
											{log.undertimeMinutes || 0}m
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
};

export default EmployeeDashboard;
