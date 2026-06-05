import React, { useState, useEffect } from 'react';
import { THEME, commonStyles } from '../components/CommonStyles';
import BACKEND_URL from '../backendConfig';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = ({ onLogout, setView }) => {
	//User
	const { user } = useAuth();
	const token = user?.token;
	// --- STATE MANAGEMENT ---
	const [currentTab, setCurrentTab] = useState('daily'); // 'daily' | 'weekly' | 'punches'
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [reportData, setReportData] = useState([]);
	const [punchLogs, setPunchLogs] = useState([]);

	// Date Pickers (Defaults to Today: 2026-06-02)
	const [selectedDate, setSelectedDate] = useState('2026-06-02');
	const [selectedWeek, setSelectedWeek] = useState('2026-06-01'); // A Monday for the week tracker

	// Editing state structure to align with your PUT endpoint
	const [editingPunchId, setEditingPunchId] = useState(null);
	const [editForm, setEditForm] = useState({
		regularHours: 0,
		overtimeHours: 0,
		nightDiffHours: 0,
		latenessMinutes: 0,
		undertimeMinutes: 0
	});
	const API = (path) => `${BACKEND_URL}${path}`;

	// --- FETCH DATA CONTROLLER ---
	const fetchAdminData = async (tab) => {
		if (!user?.token) {
			setErrorMessage("No auth token found");
			return;
		}
		setLoading(true);
		setErrorMessage('');


		const token = user?.token

		// Map directly to your actual API endpoints
		let endpoint = API(`/api/admin/attendance/daily-report?date=${selectedDate}`);
		if (tab === 'weekly') endpoint = API(`/api/admin/attendance/weekly-report?startOfWeek=${selectedWeek}`);
		if (tab === 'punches') endpoint = API('/api/admin/attendance/punches');

		try {
			const response = await fetch(endpoint, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});

			const resData = await response.json();
			if (!response.ok) throw new Error(resData.error || 'Failed to fetch administrative records.');

			// Handle different structure returns safely
			if (tab === 'punches') {
				setPunchLogs(resData.data || []);
			} else {
				setReportData(resData.data || []);
			}
		} catch (err) {
			setErrorMessage(err.message);
			if (tab === 'punches') setPunchLogs([]);
			else setReportData([]);
		} finally {
			setLoading(false);
		}
	};

	// Refresh lists whenever the view tab or filter criteria shifts
	useEffect(() => {
		if (!user?.token) return;
		fetchAdminData(currentTab);
	}, [currentTab, selectedDate, selectedWeek, user?.token]);

	// --- EDIT / UPDATE ACTION HANDLERS ---
	const handleStartEdit = (log) => {
		setEditingPunchId(log.id);
		setEditForm({
			regularHours: log.regularHours || 0,
			overtimeHours: log.overtimeHours || 0,
			nightDiffHours: log.nightDiffHours || 0,
			latenessMinutes: log.latenessMinutes || 0,
			undertimeMinutes: log.undertimeMinutes || 0
		});
	};

	const handleCancelEdit = () => {
		setEditingPunchId(null);
	};

	const handleSavePunch = async (id) => {
		const token = user?.token;
		try {
			// Matches: PUT /api/admin/attendance/punch/:id
			const response = await fetch(API(`/api/admin/attendance/punch/${id}`), {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				// Wraps adjustments into the required updatedFields schema object
				body: JSON.stringify({ updatedFields: editForm })
			});

			const resData = await response.json();
			if (!response.ok) throw new Error(resData.error || 'Failed to save punch adjustments.');

			setEditingPunchId(null);
			fetchAdminData('punches');
		} catch (err) {
			setErrorMessage(err.message);
		}
	};

	// --- CSS OBJECT STYLES ---
	const styles = {
		nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: THEME.surface, padding: '16px 24px', borderRadius: '8px', border: `1px solid ${THEME.border}`, marginBottom: '24px' },
		grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' },
		widget: { backgroundColor: THEME.surface, padding: '24px', borderRadius: THEME.radius, border: `1px solid ${THEME.border}` },
		tabsContainer: { display: 'flex', gap: '8px', borderBottom: `2px solid ${THEME.border}`, marginBottom: '20px', paddingBottom: '1px', alignItems: 'center', justifyContent: 'space-between' },
		tabGroup: { display: 'flex', gap: '4px' },
		tabButton: (isActive) => ({
			padding: '10px 20px',
			border: 'none',
			background: 'none',
			borderBottom: isActive ? `3px solid ${THEME.primary}` : '3px solid transparent',
			color: isActive ? THEME.primary : THEME.textMuted,
			fontWeight: '600',
			cursor: 'pointer',
			fontSize: '14px'
		}),
		filterInput: { padding: '6px 12px', borderRadius: '6px', border: `1px solid ${THEME.border}`, fontFamily: 'inherit', fontSize: '14px', color: THEME.text },
		tableContainer: { overflowX: 'auto', backgroundColor: THEME.surface, borderRadius: THEME.radius, border: `1px solid ${THEME.border}`, padding: '16px' },
		table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
		th: { backgroundColor: '#f8fafc', padding: '12px', borderBottom: `2px solid ${THEME.border}`, color: THEME.textMuted, fontWeight: '600' },
		td: { padding: '12px', borderBottom: `1px solid ${THEME.border}` },
		input: { width: '70px', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${THEME.border}`, fontSize: '14px' },
		error: { padding: '12px', backgroundColor: '#fff5f5', color: '#c53030', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }
	};

	return (
		<div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
			{errorMessage && <div style={styles.error}>⚠️ {errorMessage}</div>}

			{/* Navigation Header */}
			<div style={styles.nav}>
				<div>
					<h3 style={{ margin: 0 }}>🛡️ Admin Panel</h3>
					<span style={{ fontSize: '12px', color: THEME.textMuted }}>Welcome back, {user.name || 'Administrator'}</span>
				</div>
				<button style={{ ...commonStyles.btn, backgroundColor: '#e53e3e', color: '#fff' }} onClick={onLogout}>Logout</button>
			</div>

			{/* Executive Quick Widgets */}
			<div style={styles.grid}>
				<div style={styles.widget}>
					<h4>Account Actions</h4>
					<p style={{ fontSize: '14px', color: THEME.textMuted, margin: '8px 0 16px 0' }}>Provision corporate authentication profiles and schedules.</p>
					<button
						style={{ ...commonStyles.btn, backgroundColor: THEME.primary, color: '#fff', width: '100%' }}
						onClick={() => setView('register')}
					>
						+ Create New Employee Profile
					</button>
				</div>

				<div style={styles.widget}>
					<h4>System Connectivity</h4>
					<p style={{ fontSize: '28px', fontWeight: 'bold', margin: '12px 0' }}>Active State</p>
					<span style={{ color: THEME.success, fontSize: '14px', fontWeight: '500' }}>● Connected to Firebase Emulator</span>
				</div>
			</div>

			{/* --- WORKSPACE VIEW CONTROLS (TABS & FILTERS) --- */}
			<div style={styles.tabsContainer}>
				<div style={styles.tabGroup}>
					<button style={styles.tabButton(currentTab === 'daily')} onClick={() => setCurrentTab('daily')}>📋 Daily Reports</button>
					<button style={styles.tabButton(currentTab === 'weekly')} onClick={() => setCurrentTab('weekly')}>📊 Weekly Reports</button>
					<button style={styles.tabButton(currentTab === 'punches')} onClick={() => setCurrentTab('punches')}>✏️ View / Edit Punches</button>
				</div>

				{/* Dynamic Context Filters depending on active tab requirements */}
				<div>
					{currentTab === 'daily' && (
						<label style={{ fontSize: '14px', color: THEME.textMuted, fontWeight: '500' }}>
							Target Date: &nbsp;
							<input type="date" style={styles.filterInput} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
						</label>
					)}
					{currentTab === 'weekly' && (
						<label style={{ fontSize: '14px', color: THEME.textMuted, fontWeight: '500' }}>
							Week Starting: &nbsp;
							<input type="date" style={styles.filterInput} value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} />
						</label>
					)}
				</div>
			</div>

			{/* --- REPORT TABLES WORKSPACE --- */}
			<div style={styles.tableContainer}>
				{loading ? (
					<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '32px 0' }}>Syncing administrative databases...</p>
				) : (
					<>
						{/* Daily & Weekly Reports View */}
						{(currentTab === 'daily' || currentTab === 'weekly') && (
							reportData.length === 0 ? (
								<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '24px 0' }}>No records found matching the chosen parameters.</p>
							) : (
								<table style={styles.table}>
									<thead>
										<tr>
											<th style={styles.th}>Employee UID</th>
											<th style={styles.th}>Regular</th>
											<th style={styles.th}>Overtime</th>
											<th style={styles.th}>Night Diff</th>
											<th style={styles.th}>Lateness</th>
											<th style={styles.th}>Undertime</th>
											{currentTab === 'weekly' && <th style={styles.th}>Days Worked</th>}
										</tr>
									</thead>
									<tbody>
										{reportData.map((report, idx) => (
											<tr key={report.userId || idx}>
												<td style={styles.td}><strong>{report.userId}</strong></td>
												<td style={styles.td}>{report.regularHours?.toFixed(2)}h</td>
												<td style={{ ...styles.td, color: report.overtimeHours > 0 ? THEME.info : THEME.text }}>{report.overtimeHours?.toFixed(2)}h</td>
												<td style={{ ...styles.td, color: report.nightDiffHours > 0 ? '#6b21a8' : THEME.text }}>{report.nightDiffHours?.toFixed(2)}h</td>
												<td style={{ ...styles.td, color: report.latenessMinutes > 0 ? '#c53030' : THEME.text }}>{report.latenessMinutes}m</td>
												<td style={{ ...styles.td, color: report.undertimeMinutes > 0 ? '#dd6b20' : THEME.text }}>{report.undertimeMinutes}m</td>
												{currentTab === 'weekly' && <td style={styles.td}>{report.daysWorked} days</td>}
											</tr>
										))}
									</tbody>
								</table>
							)
						)}

						{/* Edit Punches View */}
						{currentTab === 'punches' && (
							punchLogs.length === 0 ? (
								<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '24px 0' }}>No active time punches discovered.</p>
							) : (
								<table style={styles.table}>
									<thead>
										<tr>
											<th style={styles.th}>Employee UID</th>
											<th style={styles.th}>Date Logged</th>
											<th style={styles.th}>Regular</th>
											<th style={styles.th}>Overtime</th>
											<th style={styles.th}>Night Diff</th>
											<th style={styles.th}>Lateness</th>
											<th style={styles.th}>Undertime</th>
											<th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
										</tr>
									</thead>
									<tbody>
										{punchLogs.map((log) => {
											const isEditing = editingPunchId === log.id;
											return (
												<tr key={log.id}>
													<td style={styles.td}><strong>{log.userId}</strong></td>
													<td style={styles.td}>{log.date}</td>

													<td style={styles.td}>
														{isEditing ? (
															<input
																type="number"
																step="0.01"
																style={styles.input}
																value={editForm.regularHours}
																onChange={(e) => setEditForm({ ...editForm, regularHours: parseFloat(e.target.value) || 0 })}
															/>
														) : `${log.regularHours?.toFixed(2) || '0.00'}h`}
													</td>

													<td style={styles.td}>
														{isEditing ? (
															<input
																type="number"
																step="0.01"
																style={styles.input}
																value={editForm.overtimeHours}
																onChange={(e) => setEditForm({ ...editForm, overtimeHours: parseFloat(e.target.value) || 0 })}
															/>
														) : `${log.overtimeHours?.toFixed(2) || '0.00'}h`}
													</td>

													<td style={styles.td}>
														{isEditing ? (
															<input
																type="number"
																step="0.01"
																style={styles.input}
																value={editForm.nightDiffHours}
																onChange={(e) => setEditForm({ ...editForm, nightDiffHours: parseFloat(e.target.value) || 0 })}
															/>
														) : `${log.nightDiffHours?.toFixed(2) || '0.00'}h`}
													</td>

													<td style={styles.td}>
														{isEditing ? (
															<input
																type="number"
																style={styles.input}
																value={editForm.latenessMinutes}
																onChange={(e) => setEditForm({ ...editForm, latenessMinutes: parseInt(e.target.value) || 0 })}
															/>
														) : `${log.latenessMinutes || 0}m`}
													</td>

													<td style={styles.td}>
														{isEditing ? (
															<input
																type="number"
																style={styles.input}
																value={editForm.undertimeMinutes}
																onChange={(e) => setEditForm({ ...editForm, undertimeMinutes: parseInt(e.target.value) || 0 })}
															/>
														) : `${log.undertimeMinutes || 0}m`}
													</td>

													<td style={{ ...styles.td, textAlign: 'right' }}>
														{isEditing ? (
															<div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
																<button style={{ ...commonStyles.btn, backgroundColor: THEME.success, color: '#fff', padding: '4px 10px', fontSize: '12px' }} onClick={() => handleSavePunch(log.id)}>Save</button>
																<button style={{ ...commonStyles.btn, backgroundColor: THEME.border, color: THEME.text, padding: '4px 10px', fontSize: '12px' }} onClick={handleCancelEdit}>Cancel</button>
															</div>
														) : (
															<button
																style={{ ...commonStyles.btn, backgroundColor: THEME.info, color: '#fff', padding: '4px 12px', fontSize: '12px' }}
																onClick={() => handleStartEdit(log)}
															>
																✍️ Edit
															</button>
														)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							)
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default AdminDashboard;
