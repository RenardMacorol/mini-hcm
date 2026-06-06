import React, { useState, useEffect, useCallback } from 'react';
import { THEME } from '../components/CommonStyles';
import BACKEND_URL from '../backendConfig';
import { useAuth } from '../context/AuthContext';
import {
	BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
	RiShieldCheckLine, RiLogoutBoxLine,
	RiCalendarLine, RiClipboardLine,
	RiBarChartBoxLine, RiEditLine, RiSaveLine, RiCloseLine,
	RiAlertLine, RiUserLine, RiCheckboxCircleLine,
	RiPieChartLine, RiTimeLine, RiMoonLine, RiClockwiseLine,
	RiArrowDownSLine,
} from 'react-icons/ri';

/* ─────────────────────────────────────────────
   EDIT PUNCH MODAL
───────────────────────────────────────────── */
const EditPunchModal = ({ log, onSave, onClose, saving }) => {
	const [form, setForm] = useState({
		regularHours: log.metrics?.regularHours ?? 0,
		overtimeHours: log.metrics?.overtimeHours ?? 0,
		nightDiffHours: log.metrics?.nightDiffHours ?? 0,
		latenessMinutes: log.metrics?.latenessMinutes ?? 0,
		undertimeMinutes: log.metrics?.undertimeMinutes ?? 0,
	});

	const field = (key, label, icon, color, isFloat = true) => (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
			<label style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.7px', textTransform: 'uppercase', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
				<span style={{ color }}>{icon}</span>{label}
			</label>
			<div style={{ position: 'relative' }}>
				<input
					type="number"
					step={isFloat ? '0.01' : '1'}
					min="0"
					value={form[key]}
					onChange={(e) => setForm({ ...form, [key]: isFloat ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 })}
					style={{
						width: '100%', boxSizing: 'border-box',
						padding: '10px 40px 10px 12px',
						border: `1.5px solid #e2e8f0`,
						borderRadius: '8px', fontSize: '15px', fontWeight: '600',
						color: '#0f172a', outline: 'none',
						transition: 'border-color 0.15s',
						fontFamily: "'DM Mono', monospace",
					}}
					onFocus={e => e.target.style.borderColor = color}
					onBlur={e => e.target.style.borderColor = '#e2e8f0'}
				/>
				<span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: '700', color: '#94a3b8', pointerEvents: 'none' }}>
					{isFloat ? 'h' : 'm'}
				</span>
			</div>
		</div>
	);

	return (
		<div style={{
			position: 'fixed', inset: 0, zIndex: 1000,
			backgroundColor: 'rgba(15,23,42,0.55)',
			backdropFilter: 'blur(4px)',
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			padding: '24px',
		}} onClick={onClose}>
			<div style={{
				backgroundColor: '#fff',
				borderRadius: '16px',
				width: '100%', maxWidth: '480px',
				boxShadow: '0 24px 64px rgba(15,23,42,0.18)',
				overflow: 'hidden',
			}} onClick={e => e.stopPropagation()}>

				{/* Modal Header */}
				<div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
					<div>
						<h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
							Edit Punch Record
						</h3>
						<p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
							<strong style={{ color: '#0f172a' }}>{log.employeeName || log.userId}</strong>
							{' · '}{log.date}
						</p>
					</div>
					<button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
						<RiCloseLine size={20} />
					</button>
				</div>

				{/* Fields */}
				<div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
					{field('regularHours', 'Regular Hours', <RiTimeLine size={12} />, THEME.success ?? '#22c55e')}
					{field('overtimeHours', 'Overtime Hours', <RiClockwiseLine size={12} />, THEME.info ?? '#3b82f6')}
					{field('nightDiffHours', 'Night Differential', <RiMoonLine size={12} />, '#7c3aed')}
					<div /> {/* spacer to push late/undertime below */}
					{field('latenessMinutes', 'Late', <RiAlertLine size={12} />, '#dc2626', false)}
					{field('undertimeMinutes', 'Undertime', <RiArrowDownSLine size={12} />, '#ea580c', false)}
				</div>

				{/* Actions */}
				<div style={{ padding: '0 24px 20px', display: 'flex', gap: '10px' }}>
					<button
						onClick={() => onSave(log.id, form)}
						disabled={saving}
						style={{
							flex: 1, padding: '11px', borderRadius: '8px',
							backgroundColor: THEME.success ?? '#22c55e',
							color: '#fff', border: 'none',
							fontWeight: '700', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
							opacity: saving ? 0.7 : 1,
							display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
						}}>
						<RiSaveLine size={15} />{saving ? 'Saving…' : 'Save Changes'}
					</button>
					<button
						onClick={onClose}
						style={{
							padding: '11px 20px', borderRadius: '8px',
							backgroundColor: '#f8fafc', color: '#475569',
							border: '1px solid #e2e8f0',
							fontWeight: '600', fontSize: '14px', cursor: 'pointer',
						}}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

/* ─────────────────────────────────────────────
   MAIN ADMIN DASHBOARD
───────────────────────────────────────────── */
const AdminDashboard = ({ onLogout }) => {
	const API = (path) => `${BACKEND_URL}${path}`;
	const { user } = useAuth();

	const [currentTab, setCurrentTab] = useState('overview');
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [reportData, setReportData] = useState([]);
	const [punchLogs, setPunchLogs] = useState([]);

	const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [selectedWeek, setSelectedWeek] = useState('2026-06-01');

	// Modal state
	const [editingLog, setEditingLog] = useState(null);
	const [saving, setSaving] = useState(false);

	// Chart data
	const [chartData, setChartData] = useState([]);
	const [trendData, setTrendData] = useState([]);
	const [complianceData, setComplianceData] = useState([]);
	const [chartsLoading, setChartsLoading] = useState(true);

	// ── employee name cache: { [userId]: displayName }
	const [nameCache, setNameCache] = useState({});

	/* Resolve a userId to a display name */
	const resolveName = useCallback((userId) => {
		if (!userId) return 'Unknown';
		return nameCache[userId] || userId;
	}, [nameCache]);

	/* Optionally fetch employee list to build name cache */
	const fetchEmployees = useCallback(async () => {
		if (!user?.token) return;
		try {
			const res = await fetch(API('/api/admin/attendance/users'), {
				headers: { Authorization: `Bearer ${user.token}` },
			});
			if (!res.ok) return;
			const data = await res.json();
			const cache = {};
			(data.data || []).forEach((emp) => {
				if (emp.uid) cache[emp.uid] = emp.name || emp.email || emp.uid;
			});
			setNameCache(cache);
		} catch {
			// name resolution is best-effort
		}
	}, [user?.token]);

	useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

	const fetchAdminData = async (tab) => {
		if (!user?.token) { setErrorMessage('No auth token found'); return; }
		setLoading(true);
		setErrorMessage('');
		const tok = user.token;
		let endpoint = API(`/api/admin/attendance/daily-report?date=${selectedDate}`);
		if (tab === 'weekly') endpoint = API(`/api/admin/attendance/weekly-report?startOfWeek=${selectedWeek}`);
		if (tab === 'punches') endpoint = API('/api/admin/attendance/punches');
		try {
			const res = await fetch(endpoint, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` } });
			const resData = await res.json();
			if (!res.ok) throw new Error(resData.error || 'Failed to fetch records.');
			const rows = (resData.data || []).filter(Boolean);
			if (tab === 'punches') setPunchLogs(rows);
			else setReportData(rows);
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
			const res = await fetch(API('/api/admin/attendance/punches'), {
				headers: { Authorization: `Bearer ${user.token}` },
			});
			const resData = await res.json();
			const logs = (resData.data || []).filter(Boolean);

			// Per-employee hours
			const byUser = {};
			logs.forEach((log) => {
				const id = log.userId || 'N/A';
				const label = (nameCache[id] || id).slice(0, 10);
				if (!byUser[id]) byUser[id] = { name: label, regular: 0, overtime: 0, nightDiff: 0 };
				byUser[id].regular += log.metrics?.regularHours || 0;
				byUser[id].overtime += log.metrics?.overtimeHours || 0;
				byUser[id].nightDiff += log.metrics?.nightDiffHours || 0;
			});
			setChartData(Object.values(byUser).slice(0, 8));

			// Daily trend
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

			// Compliance
			let onTime = 0, late = 0, undertime = 0;
			logs.forEach((log) => {
				if ((log.metrics?.latenessMinutes || 0) > 0) late++;
				else if ((log.metrics?.undertimeMinutes || 0) > 0) undertime++;
				else onTime++;
			});
			setComplianceData([
				{ name: 'On Time', value: onTime, color: THEME.success ?? '#22c55e' },
				{ name: 'Late', value: late, color: '#ef4444' },
				{ name: 'Undertime', value: undertime, color: '#f97316' },
			]);
		} catch { /* silently fail */ } finally { setChartsLoading(false); }
	};

	useEffect(() => {
		if (!user?.token) return;
		if (currentTab === 'overview') fetchChartData();
		else fetchAdminData(currentTab);
	}, [currentTab, selectedDate, selectedWeek, user?.token, nameCache]);

	const handleSavePunch = async (id, form) => {
		setSaving(true);
		try {
			const res = await fetch(API(`/api/admin/attendance/punch/${id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
				body: JSON.stringify({ updatedFields: form }),
			});
			const resData = await res.json();
			if (!res.ok) throw new Error(resData.error || 'Failed to save.');
			setEditingLog(null);
			await fetchAdminData('punches');
		} catch (err) {
			setErrorMessage(err.message);
		} finally {
			setSaving(false);
		}
	};

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: <RiPieChartLine size={14} /> },
		{ id: 'daily', label: 'Daily Reports', icon: <RiClipboardLine size={14} /> },
		{ id: 'weekly', label: 'Weekly Reports', icon: <RiBarChartBoxLine size={14} /> },
		{ id: 'punches', label: 'Edit Punches', icon: <RiEditLine size={14} /> },
	];

	const CustomTooltip = ({ active, payload, label }) => {
		if (!active || !payload?.length) return null;
		return (
			<div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
				<p style={{ fontWeight: '700', marginBottom: '6px', color: '#0f172a', margin: '0 0 6px' }}>{label}</p>
				{payload.map((p) => (
					<p key={p.name} style={{ color: p.color, margin: '2px 0', fontSize: '12px' }}>
						{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
					</p>
				))}
			</div>
		);
	};

	/* ── STAT BADGE used in report rows ── */
	const StatBadge = ({ value, unit, warn }) => (
		<span style={{
			display: 'inline-flex', alignItems: 'baseline', gap: '1px',
			fontWeight: '700', fontSize: '13px',
			color: warn ? (warn === 'red' ? '#dc2626' : warn === 'orange' ? '#ea580c' : '#7c3aed') : '#0f172a',
		}}>
			{value}<span style={{ fontSize: '10px', fontWeight: '500', opacity: 0.7 }}>{unit}</span>
		</span>
	);

	const s = {
		page: {
			maxWidth: '1200px', margin: '0 auto', padding: '28px 24px',
			fontFamily: "'DM Sans', system-ui, sans-serif",
			minHeight: '100vh', backgroundColor: '#f8fafc',
		},
		nav: {
			display: 'flex', justifyContent: 'space-between', alignItems: 'center',
			backgroundColor: '#fff', padding: '14px 20px', borderRadius: '14px',
			border: '1px solid #e2e8f0', marginBottom: '20px',
			boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
		},
		tabBar: {
			display: 'flex', justifyContent: 'space-between', alignItems: 'center',
			backgroundColor: '#fff', padding: '0 20px', borderRadius: '14px 14px 0 0',
			border: '1px solid #e2e8f0', borderBottom: 'none',
		},
		tabBtn: (active) => ({
			display: 'flex', alignItems: 'center', gap: '6px',
			padding: '14px 14px', border: 'none', background: 'none',
			borderBottom: active ? `2px solid ${THEME.primary ?? '#3b82f6'}` : '2px solid transparent',
			color: active ? (THEME.primary ?? '#3b82f6') : '#94a3b8',
			fontWeight: active ? '700' : '500', fontSize: '13px', cursor: 'pointer',
			transition: 'color 0.15s',
		}),
		tableWrap: {
			backgroundColor: '#fff', borderRadius: '0 0 14px 14px',
			border: '1px solid #e2e8f0', overflowX: 'auto',
			boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
		},
		th: {
			padding: '10px 16px', fontSize: '10px', fontWeight: '700',
			letterSpacing: '0.8px', textTransform: 'uppercase', color: '#94a3b8',
			backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap',
		},
		td: {
			padding: '13px 16px', fontSize: '13px',
			borderBottom: '1px solid #f1f5f9', color: '#334155', verticalAlign: 'middle',
		},
		chartCard: {
			backgroundColor: '#fff', borderRadius: '12px',
			border: '1px solid #e2e8f0', padding: '22px 24px', marginBottom: '0',
			boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
		},
		chartTitle: { fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px' },
		chartSub: { fontSize: '12px', color: '#94a3b8', margin: '0 0 18px' },
		empName: {
			fontWeight: '700', fontSize: '13px', color: '#0f172a',
			display: 'flex', alignItems: 'center', gap: '7px',
		},
		empAvatar: (name) => ({
			width: '28px', height: '28px', borderRadius: '50%',
			backgroundColor: '#eff6ff', color: THEME.primary ?? '#3b82f6',
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			fontSize: '11px', fontWeight: '800', flexShrink: 0,
		}),
	};

	const avatarInitial = (name) => {
		if (!name) return '?';
		const parts = name.trim().split(' ');
		return parts.length >= 2
			? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
			: name.slice(0, 2).toUpperCase();
	};

	const EmployeeCell = ({ userId }) => {
		const name = resolveName(userId);
		const isUID = name === userId && userId?.length > 16;
		return (
			<div style={s.empName}>
				<div style={s.empAvatar(name)}>
					{isUID ? <RiUserLine size={12} /> : avatarInitial(name)}
				</div>
				<span style={{ color: isUID ? '#94a3b8' : '#0f172a', fontFamily: isUID ? "'DM Mono', monospace" : 'inherit', fontSize: isUID ? '11px' : '13px' }}>
					{isUID ? name.slice(0, 12) + '…' : name}
				</span>
			</div>
		);
	};

	const dateInputStyle = {
		padding: '7px 10px', borderRadius: '8px', border: '1px solid #e2e8f0',
		fontSize: '13px', color: '#334155', cursor: 'pointer', outline: 'none',
		fontFamily: "'DM Sans', system-ui, sans-serif",
	};

	return (
		<div style={s.page}>
			{/* Modal */}
			{editingLog && (
				<EditPunchModal
					log={editingLog}
					onSave={handleSavePunch}
					onClose={() => setEditingLog(null)}
					saving={saving}
				/>
			)}

			{/* Error Banner */}
			{errorMessage && (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', border: '1px solid #fecaca' }}>
					<RiAlertLine size={15} />{errorMessage}
					<button onClick={() => setErrorMessage('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><RiCloseLine size={15} /></button>
				</div>
			)}

			{/* NAV */}
			<div style={s.nav}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
					<div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.primary ?? '#3b82f6' }}>
						<RiShieldCheckLine size={19} />
					</div>
					<div>
						<h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', letterSpacing: '-0.3px', color: '#0f172a' }}>Admin Panel</h3>
						<span style={{ fontSize: '12px', color: '#94a3b8' }}>Welcome back, {user.name || 'Administrator'}</span>
					</div>
				</div>
				<button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
					<RiLogoutBoxLine size={14} />Logout
				</button>
			</div>

			{/* TAB BAR */}
			<div style={{ marginTop: '20px' }}>
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
							<label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#64748b' }}>
								<RiCalendarLine size={14} />
								<input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={dateInputStyle} />
							</label>
						)}
						{currentTab === 'weekly' && (
							<label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#64748b' }}>
								<RiCalendarLine size={14} />Week of:
								<input type="date" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} style={dateInputStyle} />
							</label>
						)}
					</div>
				</div>

				{/* ── OVERVIEW: CHARTS ── */}
				{currentTab === 'overview' && (
					<div style={{ backgroundColor: '#fff', borderRadius: '0 0 14px 14px', border: '1px solid #e2e8f0', borderTop: 'none', padding: '24px' }}>
						{chartsLoading ? (
							<p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px 0', fontSize: '14px' }}>Loading analytics…</p>
						) : (
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>

								{/* Hours by Employee */}
								<div style={s.chartCard}>
									<p style={s.chartTitle}>Hours by Employee</p>
									<p style={s.chartSub}>Regular, overtime & night differential breakdown</p>
									{chartData.length === 0
										? <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No data available</p>
										: (
											<ResponsiveContainer width="100%" height={240}>
												<BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
													<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
													<XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
													<YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
													<Tooltip content={<CustomTooltip />} />
													<Legend wrapperStyle={{ fontSize: '12px' }} />
													<Bar dataKey="regular" name="Regular" fill={THEME.primary ?? '#3b82f6'} radius={[4, 4, 0, 0]} />
													<Bar dataKey="overtime" name="Overtime" fill={THEME.success ?? '#22c55e'} radius={[4, 4, 0, 0]} />
													<Bar dataKey="nightDiff" name="Night Diff" fill="#7c3aed" radius={[4, 4, 0, 0]} />
												</BarChart>
											</ResponsiveContainer>
										)}
								</div>

								{/* Compliance Donut */}
								<div style={s.chartCard}>
									<p style={s.chartTitle}>Attendance Compliance</p>
									<p style={s.chartSub}>On-time vs late vs undertime across all records</p>
									{complianceData.every(d => d.value === 0)
										? <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No data available</p>
										: (
											<ResponsiveContainer width="100%" height={240}>
												<PieChart>
													<Pie data={complianceData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
														{complianceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
													</Pie>
													<Tooltip formatter={(v, n) => [v + ' records', n]} />
													<Legend formatter={(value, entry) => (
														<span style={{ fontSize: '12px', color: '#334155' }}>{value}: <strong>{entry.payload.value}</strong></span>
													)} />
												</PieChart>
											</ResponsiveContainer>
										)}
								</div>

								{/* Trend Line — full width */}
								<div style={{ ...s.chartCard, gridColumn: '1 / -1' }}>
									<p style={s.chartTitle}>Average Daily Hours Trend</p>
									<p style={s.chartSub}>Avg hours worked per employee over the last 14 logged days</p>
									{trendData.length === 0
										? <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No trend data available</p>
										: (
											<ResponsiveContainer width="100%" height={220}>
												<LineChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
													<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
													<XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
													<YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={['auto', 'auto']} />
													<Tooltip content={<CustomTooltip />} />
													<Line type="monotone" dataKey="avgHours" name="Avg Hours" stroke={THEME.primary ?? '#3b82f6'} strokeWidth={2.5} dot={{ r: 4, fill: THEME.primary ?? '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
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
							<p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px 0', fontSize: '14px' }}>Loading records…</p>
						) : (
							<>
								{/* Daily / Weekly Reports */}
								{(currentTab === 'daily' || currentTab === 'weekly') && (
									reportData.length === 0
										? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px 0', fontSize: '14px' }}>No records found.</p>
										: (
											<table style={{ width: '100%', borderCollapse: 'collapse' }}>
												<thead>
													<tr>
														{['Employee', 'Regular', 'Overtime', 'Night Diff', 'Late', 'Undertime', ...(currentTab === 'weekly' ? ['Days Worked'] : [])].map((col) => (
															<th key={col} style={s.th}>{col}</th>
														))}
													</tr>
												</thead>
												<tbody>
													{reportData.filter(Boolean).map((report, idx) => (
														<tr key={report.userId || idx} style={{ transition: 'background 0.1s' }}
															onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
															onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
															<td style={s.td}><EmployeeCell userId={report.userId} /></td>
															<td style={s.td}><StatBadge value={(report.regularHours ?? 0).toFixed(2)} unit="h" /></td>
															<td style={s.td}><StatBadge value={(report.overtimeHours ?? 0).toFixed(2)} unit="h" warn={report.overtimeHours > 0 ? 'blue' : null} /></td>
															<td style={s.td}><StatBadge value={(report.nightDiffHours ?? 0).toFixed(2)} unit="h" warn={report.nightDiffHours > 0 ? 'purple' : null} /></td>
															<td style={s.td}><StatBadge value={report.latenessMinutes ?? 0} unit="m" warn={report.latenessMinutes > 0 ? 'red' : null} /></td>
															<td style={s.td}><StatBadge value={report.undertimeMinutes ?? 0} unit="m" warn={report.undertimeMinutes > 0 ? 'orange' : null} /></td>
															{currentTab === 'weekly' && <td style={s.td}><StatBadge value={report.daysWorked} unit=" days" /></td>}
														</tr>
													))}
												</tbody>
											</table>
										)
								)}

								{/* Edit Punches */}
								{currentTab === 'punches' && (
									punchLogs.length === 0
										? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px 0', fontSize: '14px' }}>No punch records found.</p>
										: (
											<table style={{ width: '100%', borderCollapse: 'collapse' }}>
												<thead>
													<tr>
														{['Employee', 'Date', 'Regular', 'Overtime', 'Night Diff', 'Late', 'Undertime', ''].map((col) => (
															<th key={col} style={{ ...s.th, textAlign: col === '' ? 'right' : 'left' }}>{col}</th>
														))}
													</tr>
												</thead>
												<tbody>
													{punchLogs.filter(Boolean).map((log) => (
														<tr key={log.id}
															style={{ transition: 'background 0.1s' }}
															onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
															onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
															<td style={s.td}>
																<EmployeeCell userId={log.userId} />
															</td>
															<td style={{ ...s.td, fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#64748b' }}>{log.date}</td>
															<td style={s.td}><StatBadge value={(log.metrics?.regularHours ?? 0).toFixed(2)} unit="h" /></td>
															<td style={s.td}><StatBadge value={(log.metrics?.overtimeHours ?? 0).toFixed(2)} unit="h" warn={log.metrics?.overtimeHours > 0 ? 'blue' : null} /></td>
															<td style={s.td}><StatBadge value={(log.metrics?.nightDiffHours ?? 0).toFixed(2)} unit="h" warn={log.metrics?.nightDiffHours > 0 ? 'purple' : null} /></td>
															<td style={s.td}><StatBadge value={log.metrics?.latenessMinutes ?? 0} unit="m" warn={log.metrics?.latenessMinutes > 0 ? 'red' : null} /></td>
															<td style={s.td}><StatBadge value={log.metrics?.undertimeMinutes ?? 0} unit="m" warn={log.metrics?.undertimeMinutes > 0 ? 'orange' : null} /></td>
															<td style={{ ...s.td, textAlign: 'right' }}>
																<button
																	onClick={() => setEditingLog({ ...log, employeeName: resolveName(log.userId) })}
																	style={{
																		display: 'inline-flex', alignItems: 'center', gap: '5px',
																		padding: '6px 12px',
																		backgroundColor: '#f0f9ff',
																		color: THEME.primary ?? '#3b82f6',
																		border: '1px solid #bae6fd',
																		borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer',
																		transition: 'background 0.15s',
																	}}
																	onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
																	onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f0f9ff'}
																>
																	<RiEditLine size={12} />Edit
																</button>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										)
								)}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminDashboard;
