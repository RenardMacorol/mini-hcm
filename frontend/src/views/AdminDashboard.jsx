import React, { useState, useEffect } from 'react';
import { THEME } from '../components/CommonStyles';
import BACKEND_URL from '../backendConfig';
import { useAuth } from '../context/AuthContext';
import {
	BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
	RiShieldCheckLine, RiLogoutBoxLine, RiUserAddLine,
	RiCalendarLine, RiServerLine, RiClipboardLine,
	RiBarChartBoxLine, RiEditLine, RiSaveLine, RiCloseLine,
	RiAlertLine, RiUserLine, RiCheckboxCircleLine,
	RiPieChartLine, RiLineChartLine,
} from 'react-icons/ri';

const AdminDashboard = ({ onLogout, setView }) => {
	const API = (path) => `${BACKEND_URL}${path}`;
	const { user } = useAuth();

	// Report tabs
	const [currentTab, setCurrentTab] = useState('overview');
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [reportData, setReportData] = useState([]);
	const [punchLogs, setPunchLogs] = useState([]);

	const [selectedDate, setSelectedDate] = useState('2026-06-02');
	const [selectedWeek, setSelectedWeek] = useState('2026-06-01');

	const [editingPunchId, setEditingPunchId] = useState(null);
	const [editForm, setEditForm] = useState({
		regularHours: 0, overtimeHours: 0, nightDiffHours: 0,
		latenessMinutes: 0, undertimeMinutes: 0,
	});

	// Chart data derived from punch logs
	const [chartData, setChartData] = useState([]);
	const [trendData, setTrendData] = useState([]);
	const [complianceData, setComplianceData] = useState([]);
	const [chartsLoading, setChartsLoading] = useState(true);

	const fetchAdminData = async (tab) => {
		if (!user?.token) { setErrorMessage('No auth token found'); return; }
		setLoading(true);
		setErrorMessage('');
		const tok = user.token;
		let endpoint = API(`/api/admin/attendance/daily-report?date=${selectedDate}`);
		if (tab === 'weekly') endpoint = API(`/api/admin/attendance/weekly-report?startOfWeek=${selectedWeek}`);
		if (tab === 'punches') endpoint = API('/api/admin/attendance/punches');
		try {
			const res = await fetch(endpoint, {
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
			});
			const resData = await res.json();
			if (!res.ok) throw new Error(resData.error || 'Failed to fetch records.');
			if (tab === 'punches') setPunchLogs(resData.data || []);
			else setReportData(resData.data || []);
		} catch (err) {
			setErrorMessage(err.message);
			if (tab === 'punches') setPunchLogs([]);
			else setReportData([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchChartData = async () => {
		if (!user?.token) return;
		setChartsLoading(true);
		try {
			const tok = user.token;
			// Fetch punches for chart processing
			const res = await fetch(API('/api/admin/attendance/punches'), {
				headers: { Authorization: `Bearer ${tok}` },
			});
			const resData = await res.json();
			const logs = resData.data || [];

			// 1. Per-employee hours bar chart (aggregate by userId)
			const byUser = {};
			logs.forEach((log) => {
				const id = log.userId?.slice(-6) || 'N/A'; // shorten uid for display
				if (!byUser[id]) byUser[id] = { name: id, regular: 0, overtime: 0, nightDiff: 0 };
				byUser[id].regular += log.metrics?.regularHours || 0;
				byUser[id].overtime += log.metrics?.overtimeHours || 0;
				byUser[id].nightDiff += log.metrics?.nightDiffHours || 0;
			});
			setChartData(Object.values(byUser).slice(0, 8));

			// 2. Daily trend line (last 14 days)
			const byDate = {};
			logs.forEach((log) => {
				const d = log.date || 'Unknown';
				if (!byDate[d]) byDate[d] = { date: d, hours: 0, employees: 0 };
				byDate[d].hours += (log.metrics?.regularHours || 0) + (log.metrics?.overtimeHours || 0);
				byDate[d].employees += 1;
			});
			const sorted = Object.values(byDate)
				.sort((a, b) => new Date(a.date) - new Date(b.date))
				.slice(-14)
				.map((d) => ({ ...d, avgHours: d.employees > 0 ? +(d.hours / d.employees).toFixed(2) : 0 }));
			setTrendData(sorted);

			// 3. Compliance donut (on-time vs late vs undertime)
			let onTime = 0, late = 0, undertime = 0;
			logs.forEach((log) => {
				if ((log.metrics?.latenessMinutes || 0) > 0) late++;
				else if ((log.metrics?.undertimeMinutes || 0) > 0) undertime++;
				else onTime++;
			});
			setComplianceData([
				{ name: 'On Time', value: onTime, color: THEME.success },
				{ name: 'Late', value: late, color: '#e53e3e' },
				{ name: 'Undertime', value: undertime, color: '#dd6b20' },
			]);
		} catch (e) {
			// silently fail charts
		} finally {
			setChartsLoading(false);
		}
	};

	useEffect(() => {
		if (!user?.token) return;
		if (currentTab === 'overview') {
			fetchChartData();
		} else {
			fetchAdminData(currentTab);
		}
	}, [currentTab, selectedDate, selectedWeek, user?.token]);

	const handleStartEdit = (log) => {
		setEditingPunchId(log.id);
		setEditForm({
			regularHours: log.metrics?.regularHours ?? 0,
			overtimeHours: log.metrics?.overtimeHours ?? 0,
			nightDiffHours: log.metrics?.nightDiffHours ?? 0,
			latenessMinutes: log.metrics?.latenessMinutes ?? 0,
			undertimeMinutes: log.metrics?.undertimeMinutes ?? 0,
		});
	};
	const handleCancelEdit = () => setEditingPunchId(null);
	const handleSavePunch = async (id) => {
		try {
			const res = await fetch(API(`/api/admin/attendance/punch/${id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
				body: JSON.stringify({ updatedFields: editForm }),
			});
			const resData = await res.json();
			if (!res.ok) throw new Error(resData.error || 'Failed to save.');
			setEditingPunchId(null);
			await fetchAdminData('punches');
		} catch (err) {
			setErrorMessage(err.message);
		}
	};

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: <RiPieChartLine size={15} /> },
		{ id: 'daily', label: 'Daily Reports', icon: <RiClipboardLine size={15} /> },
		{ id: 'weekly', label: 'Weekly Reports', icon: <RiBarChartBoxLine size={15} /> },
		{ id: 'punches', label: 'Edit Punches', icon: <RiEditLine size={15} /> },
	];

	const CHART_COLORS = [THEME.primary, THEME.success, '#7c3aed', '#ea580c'];

	const s = {
		page: { maxWidth: '1160px', margin: '32px auto', padding: '0 24px', fontFamily: "'Inter', system-ui, sans-serif" },
		nav: {
			display: 'flex', justifyContent: 'space-between', alignItems: 'center',
			backgroundColor: '#fff', padding: '16px 24px', borderRadius: '12px',
			border: '1px solid #e2e8f0', marginBottom: '20px',
		},
		widgetGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' },
		widget: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' },
		chartCard: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px' },
		chartTitle: { fontSize: '14px', fontWeight: '700', color: THEME.text, marginBottom: '4px' },
		chartSub: { fontSize: '12px', color: THEME.textMuted, marginBottom: '20px' },
		tabBar: {
			display: 'flex', justifyContent: 'space-between', alignItems: 'center',
			backgroundColor: '#fff', padding: '0 16px', borderRadius: '12px 12px 0 0',
			border: '1px solid #e2e8f0', borderBottom: 'none',
		},
		tabBtn: (active) => ({
			display: 'flex', alignItems: 'center', gap: '6px',
			padding: '14px 16px', border: 'none', background: 'none',
			borderBottom: active ? `2px solid ${THEME.primary}` : '2px solid transparent',
			color: active ? THEME.primary : THEME.textMuted,
			fontWeight: active ? '700' : '500', fontSize: '13px', cursor: 'pointer',
		}),
		tableWrap: {
			backgroundColor: '#fff', borderRadius: '0 0 12px 12px',
			border: '1px solid #e2e8f0', overflowX: 'auto',
		},
		th: {
			padding: '10px 14px', fontSize: '11px', fontWeight: '700',
			letterSpacing: '0.6px', textTransform: 'uppercase', color: THEME.textMuted,
			backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap',
		},
		td: { padding: '12px 14px', fontSize: '13px', borderBottom: '1px solid #f1f5f9', color: THEME.text },
		input: { width: '72px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' },
	};

	const CustomTooltip = ({ active, payload, label }) => {
		if (!active || !payload?.length) return null;
		return (
			<div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
				<p style={{ fontWeight: '700', marginBottom: '6px', color: THEME.text }}>{label}</p>
				{payload.map((p) => (
					<p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
						{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
					</p>
				))}
			</div>
		);
	};

	return (
		<div style={s.page}>
			{errorMessage && (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#fff5f5', color: '#c53030', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', border: '1px solid #fed7d7' }}>
					<RiAlertLine size={15} />{errorMessage}
				</div>
			)}

			{/* NAV */}
			<div style={s.nav}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
					<div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.primary }}>
						<RiShieldCheckLine size={20} />
					</div>
					<div>
						<h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', letterSpacing: '-0.2px' }}>Admin Panel</h3>
						<span style={{ fontSize: '12px', color: THEME.textMuted }}>Welcome, {user.name || 'Administrator'}</span>
					</div>
				</div>
				<button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'transparent', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
					<RiLogoutBoxLine size={15} />Logout
				</button>
			</div>

			{/* WIDGET ROW */}
			<div style={s.widgetGrid}>
				<div style={s.widget}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
						<RiUserLine size={16} color={THEME.textMuted} />
						<h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Account Management</h4>
					</div>
					<p style={{ fontSize: '13px', color: THEME.textMuted, margin: '0 0 16px', lineHeight: '1.5' }}>Provision employee profiles and assign shift schedules.</p>
					<button onClick={() => setView('register')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '10px', backgroundColor: THEME.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
						<RiUserAddLine size={15} />Create Employee Profile
					</button>
				</div>
				<div style={s.widget}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
						<RiServerLine size={16} color={THEME.textMuted} />
						<h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>System Connectivity</h4>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0' }}>
						<RiCheckboxCircleLine size={20} color={THEME.success} />
						<span style={{ fontSize: '16px', fontWeight: '700' }}>Active State</span>
					</div>
					<span style={{ fontSize: '13px', color: THEME.success, fontWeight: '500' }}>Connected to Firebase Emulator</span>
				</div>
			</div>

			{/* TABS */}
			<div style={s.tabBar}>
				<div style={{ display: 'flex' }}>
					{tabs.map((t) => (
						<button key={t.id} style={s.tabBtn(currentTab === t.id)} onClick={() => setCurrentTab(t.id)}>
							{t.icon}{t.label}
						</button>
					))}
				</div>
				<div>
					{currentTab === 'daily' && (
						<label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: THEME.textMuted }}>
							<RiCalendarLine size={14} />
							<input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={s.input} />
						</label>
					)}
					{currentTab === 'weekly' && (
						<label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: THEME.textMuted }}>
							<RiCalendarLine size={14} />Week of:
							<input type="date" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} style={s.input} />
						</label>
					)}
				</div>
			</div>

			{/* ── OVERVIEW TAB: CHARTS ── */}
			{currentTab === 'overview' && (
				<div style={{ backgroundColor: '#fff', borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none', padding: '24px' }}>
					{chartsLoading ? (
						<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>Loading analytics…</p>
					) : (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>

							{/* 1. Hours by Employee Bar Chart */}
							<div style={s.chartCard}>
								<p style={s.chartTitle}>Hours by Employee</p>
								<p style={s.chartSub}>Regular, overtime & night differential breakdown per employee</p>
								{chartData.length === 0 ? (
									<p style={{ color: THEME.textMuted, fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No data available</p>
								) : (
									<ResponsiveContainer width="100%" height={240}>
										<BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
											<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
											<XAxis dataKey="name" tick={{ fontSize: 11, fill: THEME.textMuted }} />
											<YAxis tick={{ fontSize: 11, fill: THEME.textMuted }} />
											<Tooltip content={<CustomTooltip />} />
											<Legend wrapperStyle={{ fontSize: '12px' }} />
											<Bar dataKey="regular" name="Regular" fill={THEME.primary} radius={[4, 4, 0, 0]} />
											<Bar dataKey="overtime" name="Overtime" fill={THEME.success} radius={[4, 4, 0, 0]} />
											<Bar dataKey="nightDiff" name="Night Diff" fill="#7c3aed" radius={[4, 4, 0, 0]} />
										</BarChart>
									</ResponsiveContainer>
								)}
							</div>

							{/* 2. Compliance Donut */}
							<div style={s.chartCard}>
								<p style={s.chartTitle}>Attendance Compliance</p>
								<p style={s.chartSub}>On-time vs late vs undertime across all punch records</p>
								{complianceData.every(d => d.value === 0) ? (
									<p style={{ color: THEME.textMuted, fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No data available</p>
								) : (
									<ResponsiveContainer width="100%" height={240}>
										<PieChart>
											<Pie data={complianceData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
												{complianceData.map((entry, i) => (
													<Cell key={i} fill={entry.color} />
												))}
											</Pie>
											<Tooltip formatter={(value, name) => [value + ' records', name]} />
											<Legend
												formatter={(value, entry) => (
													<span style={{ fontSize: '12px', color: THEME.text }}>{value}: <strong>{entry.payload.value}</strong></span>
												)}
											/>
										</PieChart>
									</ResponsiveContainer>
								)}
							</div>

							{/* 3. Daily Avg Hours Trend */}
							<div style={{ ...s.chartCard, gridColumn: '1 / -1' }}>
								<p style={s.chartTitle}>Average Daily Hours Trend</p>
								<p style={s.chartSub}>Average hours worked per employee over the last 14 logged days</p>
								{trendData.length === 0 ? (
									<p style={{ color: THEME.textMuted, fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No trend data available</p>
								) : (
									<ResponsiveContainer width="100%" height={220}>
										<LineChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
											<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
											<XAxis dataKey="date" tick={{ fontSize: 11, fill: THEME.textMuted }} />
											<YAxis tick={{ fontSize: 11, fill: THEME.textMuted }} domain={['auto', 'auto']} />
											<Tooltip content={<CustomTooltip />} />
											<Line
												type="monotone" dataKey="avgHours" name="Avg Hours"
												stroke={THEME.primary} strokeWidth={2.5}
												dot={{ r: 4, fill: THEME.primary, strokeWidth: 0 }}
												activeDot={{ r: 6 }}
											/>
										</LineChart>
									</ResponsiveContainer>
								)}
							</div>

						</div>
					)}
				</div>
			)}

			{/* ── REPORT / PUNCH TABLES ── */}
			{currentTab !== 'overview' && (
				<div style={s.tableWrap}>
					{loading ? (
						<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>Loading records…</p>
					) : (
						<>
							{(currentTab === 'daily' || currentTab === 'weekly') && (
								reportData.length === 0 ? (
									<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>No records found.</p>
								) : (
									<table style={{ width: '100%', borderCollapse: 'collapse' }}>
										<thead>
											<tr>
												{['Employee', 'Regular', 'Overtime', 'Night Diff', 'Late', 'Undertime', ...(currentTab === 'weekly' ? ['Days Worked'] : [])].map((col) => (
													<th key={col} style={s.th}>{col}</th>
												))}
											</tr>
										</thead>
										<tbody>
											{reportData.map((report, idx) => (
												<tr key={report.userId || idx}>
													<td style={{ ...s.td, fontWeight: '600' }}>{report.userId}</td>
													<td style={s.td}>{report.regularHours?.toFixed(2)}h</td>
													<td style={{ ...s.td, color: report.overtimeHours > 0 ? THEME.info : THEME.textMuted }}>{report.overtimeHours?.toFixed(2)}h</td>
													<td style={{ ...s.td, color: report.nightDiffHours > 0 ? '#7c3aed' : THEME.textMuted }}>{report.nightDiffHours?.toFixed(2)}h</td>
													<td style={{ ...s.td, color: report.latenessMinutes > 0 ? '#c53030' : THEME.textMuted }}>{report.latenessMinutes}m</td>
													<td style={{ ...s.td, color: report.undertimeMinutes > 0 ? '#dd6b20' : THEME.textMuted }}>{report.undertimeMinutes}m</td>
													{currentTab === 'weekly' && <td style={s.td}>{report.daysWorked} days</td>}
												</tr>
											))}
										</tbody>
									</table>
								)
							)}

							{currentTab === 'punches' && (
								punchLogs.length === 0 ? (
									<p style={{ color: THEME.textMuted, textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>No punch records found.</p>
								) : (
									<table style={{ width: '100%', borderCollapse: 'collapse' }}>
										<thead>
											<tr>
												{['Employee', 'Date', 'Regular', 'Overtime', 'Night Diff', 'Late', 'Undertime', ''].map((col) => (
													<th key={col} style={{ ...s.th, textAlign: col === '' ? 'right' : 'left' }}>{col}</th>
												))}
											</tr>
										</thead>
										<tbody>
											{punchLogs.map((log) => {
												const isEditing = editingPunchId === log.id;
												const numInput = (field, isFloat = true) => (
													<input type="number" step={isFloat ? '0.01' : '1'} style={s.input} value={editForm[field]}
														onChange={(e) => setEditForm({ ...editForm, [field]: isFloat ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 })}
													/>
												);
												return (
													<tr key={log.id}>
														<td style={{ ...s.td, fontWeight: '600' }}>{log.userId}</td>
														<td style={s.td}>{log.date}</td>
														<td style={s.td}>{isEditing ? numInput('regularHours') : `${log.metrics.regularHours?.toFixed(2) || '0.00'}h`}</td>
														<td style={s.td}>{isEditing ? numInput('overtimeHours') : `${log.metrics.overtimeHours?.toFixed(2) || '0.00'}h`}</td>
														<td style={s.td}>{isEditing ? numInput('nightDiffHours') : `${log.metrics.nightDiffHours?.toFixed(2) || '0.00'}h`}</td>
														<td style={s.td}>{isEditing ? numInput('latenessMinutes', false) : `${log.metrics.latenessMinutes || 0}m`}</td>
														<td style={s.td}>{isEditing ? numInput('undertimeMinutes', false) : `${log.metrics.undertimeMinutes || 0}m`}</td>
														<td style={{ ...s.td, textAlign: 'right' }}>
															{isEditing ? (
																<div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
																	<button onClick={() => handleSavePunch(log.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: THEME.success, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
																		<RiSaveLine size={13} />Save
																	</button>
																	<button onClick={handleCancelEdit} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: '#f1f5f9', color: THEME.text, border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
																		<RiCloseLine size={13} />Cancel
																	</button>
																</div>
															) : (
																<button onClick={() => handleStartEdit(log)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', backgroundColor: '#eff6ff', color: THEME.primary, border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
																	<RiEditLine size={13} />Edit
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
			)}
		</div>
	);
};

export default AdminDashboard;
