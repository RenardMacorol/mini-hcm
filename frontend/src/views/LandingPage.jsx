import { THEME, commonStyles } from '../components/CommonStyles';
const LandingPage = ({ setView, user }) => {
	const styles = {
		hero: { maxWidth: '800px', margin: '80px auto', textAlign: 'center' },
		title: { fontSize: '42px', fontWeight: '800', marginBottom: '16px', color: THEME.text },
		subtitle: { fontSize: '18px', color: THEME.textMuted, marginBottom: '32px' },
		ctaGroup: { display: 'flex', gap: '16px', justifyContent: 'center' }
	};

	return (
		<div style={styles.hero}>
			<h1 style={styles.title}>Welcome to Mini HCM</h1>
			<p style={styles.subtitle}>Streamlined workforce planning, shift scheduling, and profile management for modern teams.</p>

			<div style={styles.ctaGroup}>
				{user ? (
					<button
						style={{ ...commonStyles.btn, backgroundColor: THEME.primary, color: '#fff' }}
						onClick={() => setView('dashboard')}
					>
						Go to Dashboard
					</button>
				) : (
					<button
						style={{ ...commonStyles.btn, backgroundColor: THEME.primary, color: '#fff' }}
						onClick={() => setView('login')}
					>
						Sign In to Work Space
					</button>
				)}
			</div>
		</div>
	);
};

export default LandingPage;
