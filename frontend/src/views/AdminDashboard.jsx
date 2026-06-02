import { THEME, commonStyles } from '../components/CommonStyles';
const AdminDashboard = ({ user, onLogout, setView }) => {
	const styles = {
		nav: { display: 'flex', justifyContent: 'between', alignItems: 'center', backgroundColor: THEME.surface, padding: '16px 24px', borderRadius: '8px', border: `1px solid ${THEME.border}`, marginBottom: '24px' },
		grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
		widget: { backgroundColor: THEME.surface, padding: '24px', borderRadius: THEME.radius, border: `1px solid ${THEME.border}` }
	};

	return (
		<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
			<div style={styles.nav}>
				<div>
					<h3 style={{ margin: 0 }}>🛡️ Admin Panel</h3>
					<span style={{ fontSize: '12px', color: THEME.textMuted }}>Welcome, {user.name}</span>
				</div>
				<button style={{ ...commonStyles.btn, backgroundColor: THEME.danger, color: '#fff' }} onClick={onLogout}>Logout</button>
			</div>

			<div style={styles.grid}>
				<div style={styles.widget}>
					<h4>Quick Actions</h4>
					<p style={{ fontSize: '14px', color: THEME.textMuted }}>Provision accounts and assign shift structures.</p>
					<button
						style={{ ...commonStyles.btn, backgroundColor: THEME.primary, color: '#fff', width: '100%' }}
						onClick={() => setView('register')}
					>
						+ Create New Employee Profile
					</button>
				</div>

				<div style={styles.widget}>
					<h4>System Activity</h4>
					<p style={{ fontSize: '32px', fontWeight: 'bold', margin: '12px 0' }}>Active</p>
					<span style={{ color: THEME.success, fontSize: '14px' }}>● Connected to Firebase Emulator</span>
				</div>
			</div>
		</div>
	);
};

export default AdminDashboard;
