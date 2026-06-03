import React, { useState, useEffect } from 'react';
import BACKEND_URL from '../backendConfig';
import { THEME, commonStyles } from '../components/CommonStyles';

const EmployeeDashboard = ({ user = {}, onLogout }) => {
	// --- STATE MANAGEMENT ---
	const [punchStatus, setPunchStatus] = useState('OUT'); // Toggles between 'IN' and 'OUT'
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [historyLogs, setHistoryLogs] = useState([]);

	// Live tracking states
	const [currentTime, setCurrentTime] = useState(new Date());
	const [punchInTime, setPunchInTime] = useState(null);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const API = (path) => `${BACKEND_URL}${path}`;

	// Cumulative totals for the top summary grid
	const [summaryMetrics, setSummaryMetrics] = useState({
		regularHours: 0,
		overtimeHours: 0,
		nightDiffHours: 0,
		latenessMinutes: 0,
		undertimeMinutes: 0
	});

	// --- LIVE TIME & RUNNING CLOCK EFFECT ---
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

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

	// Format helper for the stopwatch (HH:MM:SS)
	const formatElapsedTime = (totalSeconds) => {
		const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
		const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
		const secs = String(totalSeconds % 60).padStart(2, '0');
		return `${hrs}:${mins}:${secs}`;
	};

	// --- FETCH BACKEND DATA ---
	const fetchSummaryHistory = async () => {
		try {
			setFetching(true);
			setErrorMessage('');

			const token = localStorage.getItem('authToken');


			const response = await fetch(API('/api/attendance/my-summary', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			}));

			const contentType = response.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				throw new Error(`Server returned non-JSON response (Status: ${response.status})`);
			}

			const resData = await response.json();

			if (!response.ok) {
				throw new Error(resData.error || 'Failed to sync metrics from server.');
			}

			if (resData.status === 'success' && resData.data) {
				const logs = resData.data;
				setHistoryLogs(logs);

				const totals = logs.reduce((acc, currentDoc) => ({
					regularHours: acc.regularHours + (currentDoc.regularHours || 0),
					overtimeHours: acc.overtimeHours + (currentDoc.overtimeHours || 0),
					nightDiffHours: acc.nightDiffHours + (currentDoc.nightDiffHours || 0),
					latenessMinutes: acc.latenessMinutes + (currentDoc.latenessMinutes || 0),
					undertimeMinutes: acc.undertimeMinutes + (currentDoc.undertimeMinutes || 0)
				}), { regularHours: 0, overtimeHours: 0, nightDiffHours: 0, latenessMinutes: 0, undertimeMinutes: 0 });

				setSummaryMetrics(totals);
			}
		} catch (err) {
			setErrorMessage(err.message);
		} finally {
			setFetching(false);
		}
	};

	// Run data fetch on initial dashboard layout load
	useEffect(() => {
		fetchSummaryHistory();
	}, []);

	// --- CLOCK ACTION CONTROLLER ---
	const handlePunchToggle = async () => {
		setLoading(true);
		setErrorMessage('');
		const nextType = punchStatus === 'OUT' ? 'IN' : 'OUT';
		const token = localStorage.getItem('authToken');

		try {
			const response = await fetch(API('/api/attendance/punch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ type: nextType })
			}));

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'An error occurred processing the time stamp.');
			}

			setPunchStatus(nextType);

			// Set or clear the timestamp based on modern punch action
			if (nextType === 'IN') {
				setPunchInTime(new Date());
			} else {
				setPunchInTime(null);
			}

			await fetchSummaryHistory();
			// Removed alert(data.message) to prevent popups
		} catch (err) {
			setErrorMessage(err.message);
		} finally {
			setLoading(false);
		}
	};

	// --- VIEWS / CSS OBJECT STYLES ---
	const styles = {
		container: { maxWidth: '1000px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' },
		card: { backgroundColor: THEME.surface, borderRadius: THEME.radius, padding: '32px', border: `1px solid ${THEME.border}`, marginBottom: '24px' },
		scheduleBox: { backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', marginTop: '16px', borderLeft: `4px solid ${THEME.info}` },
		grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginTop: '20px' },
		metricBox: { padding: '16px', borderRadius: '8px', border: `1px solid ${THEME.border}`, textAlign: 'center' },
		tableContainer: { overflowX: 'auto', marginTop: '16px' },
		table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
		th: { backgroundColor: '#f8fafc', padding: '12px', borderBottom: `2px solid ${THEME.border}`, color: THEME.textMuted },
		td: { padding: '12px', borderBottom: `1px solid ${THEME.border}` },
		error: { padding: '12px', backgroundColor: '#fff5f5', color: '#c53030', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' },
		liveClockText: { marginTop: '12px', fontSize: '14px', color: THEME.textMuted, textAlign: 'center', fontWeight: '500' }
	};

	return (
		<div style={styles.container}>
			{errorMessage && <div style={styles.error}>⚠️ {errorMessage}</div>}

			{/* Top Panel: Profile & Punch Interface */}
			<div style={styles.card}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
					<div>
						<h2 style={{ margin: 0 }}>👋 Hello, {user.name || 'Employee'}</h2>
						<p style={{ color: THEME.textMuted, margin: '4px 0 0 0', fontSize: '14px' }}>Employee Portal</p>
					</div>
					<button style={{ ...commonStyles.btn, backgroundColor: THEME.border, color: THEME.text }} onClick={onLogout}>Logout</button>
				</div>

				<h3>📅 Assigned Shift Breakdown</h3>
				<div style={styles.scheduleBox}>
					<p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Timezone: {user.timezone || 'Asia/Manila'}</p>
					<p style={{ margin: 0, fontSize: '15px' }}>
						⏰ Shift Hours: <strong>{user.schedule?.start || 'N/A'}</strong> to <strong>{user.schedule?.end || 'N/A'}</strong>
					</p>
				</div>

				<div style={{ marginTop: '24px' }}>
					<button
						style={{
							...commonStyles.btn,
							backgroundColor: punchStatus === 'OUT' ? THEME.success : '#e53e3e',
							color: '#fff',
							width: '100%',
							opacity: loading ? 0.7 : 1,
							cursor: loading ? 'not-allowed' : 'pointer'
						}}
						onClick={handlePunchToggle}
						disabled={loading}
					>
						📍 {loading ? 'Processing...' : punchStatus === 'OUT' ? 'Clock In' : 'Clock Out'}
					</button>

					{/* Live Clock & Shift Tracker Output */}
					<div style={styles.liveClockText}>
						🕒 Current Time: {currentTime.toLocaleTimeString()}
						{punchStatus === 'IN' && (
							<span style={{ marginLeft: '15px', color: THEME.success, fontWeight: 'bold' }}>
								⏱️ Running Shift: {formatElapsedTime(elapsedSeconds)}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Metrics Overview Grid */}
			<h3>📊 30-Day Period Attendance Summary</h3>
			<div style={styles.grid}>
				<div style={{ ...styles.metricBox, backgroundColor: '#ecfdf5' }}>
					<span style={{ fontSize: '11px', color: THEME.success, fontWeight: '700' }}>REGULAR HOURS</span>
					<h2 style={{ margin: '8px 0 0 0' }}>{summaryMetrics.regularHours.toFixed(2)}h</h2>
				</div>
				<div style={{ ...styles.metricBox, backgroundColor: '#eff6ff' }}>
					<span style={{ fontSize: '11px', color: THEME.info, fontWeight: '700' }}>OVERTIME (OT)</span>
					<h2 style={{ margin: '8px 0 0 0', color: THEME.info }}>{summaryMetrics.overtimeHours.toFixed(2)}h</h2>
				</div>
				<div style={{ ...styles.metricBox, backgroundColor: '#faf5ff' }}>
					<span style={{ fontSize: '11px', color: '#6b21a8', fontWeight: '700' }}>NIGHT DIFF (ND)</span>
					<h2 style={{ margin: '8px 0 0 0', color: '#6b21a8' }}>{summaryMetrics.nightDiffHours.toFixed(2)}h</h2>
				</div>
				<div style={{ ...styles.metricBox, backgroundColor: '#fff5f5' }}>
					<span style={{ fontSize: '11px', color: '#c53030', fontWeight: '700' }}>LATE MINUTES</span>
					<h2 style={{ margin: '8px 0 0 0', color: '#c53030' }}>{summaryMetrics.latenessMinutes}m</h2>
				</div>
				<div style={{ ...styles.metricBox, backgroundColor: '#fffaf0' }}>
					<span style={{ fontSize: '11px', color: '#dd6b20', fontWeight: '700' }}>UNDERTIME</span>
					<h2 style={{ margin: '8px 0 0 0', color: '#dd6b20' }}>{summaryMetrics.undertimeMinutes}m</h2>
				</div>
			</div>

			{/* Shift History Table Panel */}
			<div style={{ ...styles.card, marginTop: '32px' }}>
				<h3>📜 Historical Daily Summaries</h3>
				<div style={styles.tableContainer}>
					{fetching ? (
						<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '24px 0' }}>Syncing workspace data records...</p>
					) : historyLogs.length === 0 ? (
						<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '24px 0' }}>No historical entries found for this tracking cycle.</p>
					) : (
						<table style={styles.table}>
							<thead>
								<tr>
									<th style={styles.th}>Date Logged</th>
									<th style={styles.th}>Regular</th>
									<th style={styles.th}>Overtime</th>
									<th style={styles.th}>Night Diff</th>
									<th style={styles.th}>Lateness</th>
									<th style={styles.th}>Undertime</th>
								</tr>
							</thead>
							<tbody>
								{historyLogs.map((log) => (
									<tr key={log.id}>
										<td style={styles.td}><strong>{log.date}</strong></td>
										<td style={styles.td}>{log.regularHours?.toFixed(2) || '0.00'}h</td>
										<td style={{ ...styles.td, color: log.overtimeHours > 0 ? THEME.info : THEME.text }}>
											{log.overtimeHours?.toFixed(2) || '0.00'}h
										</td>
										<td style={{ ...styles.td, color: log.nightDiffHours > 0 ? '#6b21a8' : THEME.text }}>
											{log.nightDiffHours?.toFixed(2) || '0.00'}h
										</td>
										<td style={{ ...styles.td, color: log.latenessMinutes > 0 ? '#c53030' : THEME.text }}>
											{log.latenessMinutes || 0}m
										</td>
										<td style={{ ...styles.td, color: log.undertimeMinutes > 0 ? '#dd6b20' : THEME.text }}>
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
