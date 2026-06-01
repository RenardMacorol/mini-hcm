import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { db } from './firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

// System Design Theme Token Variables
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

const App = () => {
	// Active Mock State Definitions for Demo Mode
	const [userRole, setUserRole] = useState('employee'); // Toggle: 'employee' | 'admin'
	const [mockUser, setMockUser] = useState({
		id: 'emp_01',
		name: 'John Doe',
		role: 'Software Engineer',
		schedule: { start: '09:00', end: '18:00' }
	});

	const [punches, setPunches] = useState([]);
	const [summaries, setSummaries] = useState([]);
	const [loading, setLoading] = useState(false);

	// Real-Time Listener syncing directly from local Firestore Emulator data collections
	useEffect(() => {
		const punchQuery = query(
			collection(db, 'attendance'),
			where('userId', '==', mockUser.id),
			orderBy('timestamp', 'desc'),
			limit(10)
		);

		const summaryQuery = query(
			collection(db, 'dailySummary'),
			where('userId', '==', mockUser.id),
			orderBy('date', 'desc')
		);

		const unsubscribePunches = onSnapshot(punchQuery, (snapshot) => {
			setPunches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
		});

		const unsubscribeSummaries = onSnapshot(summaryQuery, (snapshot) => {
			setSummaries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
		});

		return () => {
			unsubscribePunches();
			unsubscribeSummaries();
		};
	}, [mockUser.id]);

	// Interface Handlers writing operational event payloads out to database
	const handlePunch = async (type) => {
		setLoading(true);
		try {
			await addDoc(collection(db, 'attendance'), {
				userId: mockUser.id,
				userName: mockUser.name,
				type: type,
				timestamp: new Date().toISOString()
			});
			alert(`Successfully recorded ${type} timestamp inside local emulator engine!`);
		} catch (error) {
			console.error("Error recording data trace:", error);
		} finally {
			setLoading(false);
		}
	};

	// Aggregate Metrics Computed dynamically or fetched from summaries array
	const totalRegularHours = summaries.reduce((acc, curr) => acc + (curr.regularHours || 0), 0);
	const totalOvertime = summaries.reduce((acc, curr) => acc + (curr.overtime || 0), 0);
	const totalLateMinutes = summaries.reduce((acc, curr) => acc + (curr.lateMinutes || 0), 0);

	return (
		<div style={{ backgroundColor: THEME.bg, color: THEME.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: '2rem' }}>

			{/* Top Corporate Navigation Header Panel */}
			<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '1.5rem', marginBottom: '2rem' }}>
				<div>
					<h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: THEME.primary }}>Mini HCM Cloud Framework</h1>
					<p style={{ color: THEME.textMuted, margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Enterprise Time-Tracking Ledger Dashboard</p>
				</div>

				{/* Workspace Configuration Toggle for Prototyping Admin vs Employee scenarios */}
				<div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: THEME.surface, padding: '0.5rem 1rem', borderRadius: THEME.radius, border: `1px solid ${THEME.border}` }}>
					<span style={{ fontSize: '0.85rem', fontWeight: 600, color: THEME.textMuted }}>Viewing Context:</span>
					<button
						onClick={() => setUserRole(userRole === 'employee' ? 'admin' : 'employee')}
						style={{ backgroundColor: THEME.primary, color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
					>
						Switch to {userRole === 'employee' ? 'Admin Portal' : 'Employee View'}
					</button>
				</div>
			</header>

			{/* Executive Analytics KPI Metric Matrix */}
			<section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
				<div style={styles.kpiCard}>
					<span style={{ color: THEME.textMuted, fontSize: '0.85rem', fontWeight: 600 }}>CUMULATIVE REGULAR HOURS</span>
					<h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', color: THEME.primary }}>{totalRegularHours.toFixed(2)}h</h3>
				</div>
				<div style={styles.kpiCard}>
					<span style={{ color: THEME.textMuted, fontSize: '0.85rem', fontWeight: 600 }}>OVERTIME RETAINED</span>
					<h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', color: THEME.success }}>+{totalOvertime.toFixed(2)}h</h3>
				</div>
				<div style={styles.kpiCard}>
					<span style={{ color: THEME.textMuted, fontSize: '0.85rem', fontWeight: 600 }}>LATENESS DEVIATION</span>
					<h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', color: totalLateMinutes > 0 ? THEME.danger : THEME.text }}>{totalLateMinutes} mins</h3>
				</div>
			</section>

			{/* Main Workspace Layout Block */}
			<div style={{ display: 'grid', gridTemplateColumns: userRole === 'employee' ? '1fr 2fr' : '1fr', gap: '2rem' }}>

				{/* Column Left: Operational Actions View (Only applicable for standard employees) */}
				{userRole === 'employee' && (
					<div style={styles.panelCard}>
						<h2 style={styles.panelTitle}>Shift Management Engine</h2>
						<div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
							<strong>Active Profile:</strong> {mockUser.name}<br />
							<strong>Assigned Shift:</strong> {mockUser.schedule.start} - {mockUser.schedule.end}
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
							<button
								disabled={loading}
								onClick={() => handlePunch('TIME_IN')}
								style={{ ...styles.actionButton, backgroundColor: THEME.success }}
							>
								{loading ? 'Processing Transaction...' : 'Execute Clock-In'}
							</button>
							<button
								disabled={loading}
								onClick={() => handlePunch('TIME_OUT')}
								style={{ ...styles.actionButton, backgroundColor: THEME.danger }}
							>
								{loading ? 'Processing Transaction...' : 'Execute Clock-Out'}
							</button>
						</div>
					</div>
				)}

				{/* Column Right: Data Reporting Ledger Grid */}
				<div style={styles.panelCard}>
					<h2 style={styles.panelTitle}>
						{userRole === 'admin' ? 'Global Organizational Audit Logs' : 'Personal Attendance History Ledger'}
					</h2>

					{punches.length === 0 ? (
						<div style={{ textAlign: 'center', padding: '3rem', color: THEME.textMuted, border: `2px dashed ${THEME.border}`, borderRadius: '8px' }}>
							No local timestamps discovered. Fire a Punch command or check your Node/Firebase backend loop processing state!
						</div>
					) : (
						<div style={{ overflowX: 'auto' }}>
							<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
								<thead>
									<tr style={{ borderBottom: `2px solid ${THEME.border}`, color: THEME.textMuted }}>
										<th style={{ padding: '0.75rem' }}>Transaction ID</th>
										{userRole === 'admin' && <th style={{ padding: '0.75rem' }}>Employee</th>}
										<th style={{ padding: '0.75rem' }}>Classification</th>
										<th style={{ padding: '0.75rem' }}>System Timestamp</th>
									</tr>
								</thead>
								<tbody>
									{punches.map((p) => (
										<tr key={p.id} style={{ borderBottom: `1px solid ${THEME.border}`, hover: { backgroundColor: '#f8fafc' } }}>
											<td style={{ padding: '0.75rem', fontFamily: 'monospace', color: THEME.textMuted }}>{p.id.substring(0, 8)}...</td>
											{userRole === 'admin' && <td style={{ padding: '0.75rem', fontWeight: 600 }}>{p.userName || 'Unknown'}</td>}
											<td style={{ padding: '0.75rem' }}>
												<span style={{
													backgroundColor: p.type === 'TIME_IN' ? '#ecfdf5' : '#fef2f2',
													color: p.type === 'TIME_IN' ? THEME.success : THEME.danger,
													padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem'
												}}>
													{p.type}
												</span>
											</td>
											<td style={{ padding: '0.75rem' }}>{new Date(p.timestamp).toLocaleString()}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

// Pure inline functional structural design layout styling patterns
const styles = {
	kpiCard: {
		backgroundColor: THEME.surface,
		border: `1px solid ${THEME.border}`,
		borderRadius: THEME.radius,
		padding: '1.5rem',
		boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
	},
	panelCard: {
		backgroundColor: THEME.surface,
		border: `1px solid ${THEME.border}`,
		borderRadius: THEME.radius,
		padding: '2rem',
		boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
	},
	panelTitle: {
		fontSize: '1.2rem',
		fontWeight: 600,
		margin: '0 0 1.5rem 0',
		color: THEME.text
	},
	actionButton: {
		color: '#ffffff',
		border: 'none',
		padding: '1rem',
		borderRadius: '8px',
		fontSize: '1rem',
		fontWeight: 700,
		cursor: 'pointer',
		transition: 'opacity 0.2s ease',
		boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
	}
};

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
