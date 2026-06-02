import { THEME, commonStyles } from '../components/CommonStyles';
const EmployeeDashboard = ({ user, onLogout }) => {
	const styles = {
		card: { backgroundColor: THEME.surface, borderRadius: THEME.radius, padding: '32px', maxWidth: '600px', margin: '40px auto', border: `1px solid ${THEME.border}` },
		scheduleBox: { backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', marginTop: '16px', borderLeft: `4px solid ${THEME.info}` }
	};

	return (
		<div style={styles.card}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
				<div>
					<h2 style={{ margin: 0 }}>👋 Hello, {user.name}</h2>
					<p style={{ color: THEME.textMuted, margin: '4px 0 0 0', fontSize: '14px' }}>Employee Portal</p>
				</div>
				<button style={{ ...commonStyles.btn, backgroundColor: THEME.border, color: THEME.text }} onClick={onLogout}>Logout</button>
			</div>

			<h3>📅 Assigned Shift Breakdown</h3>
			<div style={styles.scheduleBox}>
				<p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Timezone: {user.timezone || 'Not Specified'}</p>
				<p style={{ margin: 0, fontSize: '15px' }}>
					⏰ Hours: <strong>{user.schedule?.start || 'N/A'}</strong> to <strong>{user.schedule?.end || 'N/A'}</strong>
				</p>
			</div>

			<div style={{ marginTop: '24px' }}>
				<button style={{ ...commonStyles.btn, backgroundColor: THEME.success, color: '#fff', width: '100%' }}>
					📍 Clock In / Out (Upcoming)
				</button>
			</div>
		</div>
	);
};

export default EmployeeDashboard;
