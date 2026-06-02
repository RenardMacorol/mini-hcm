// System Design Theme Token Variables
export const THEME = {
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

// Reusable micro-component layout presets
export const commonStyles = {
	btn: {
		padding: '10px 18px',
		borderRadius: '6px',
		border: 'none',
		fontWeight: '600',
		cursor: 'pointer',
		fontSize: '14px',
		transition: 'all 0.2s ease-in-out',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		boxSizing: 'border-box'
	},
	inputPreset: {
		width: '100%',
		padding: '10px 14px',
		borderRadius: '6px',
		border: `1px solid ${THEME.border}`,
		fontSize: '14px',
		boxSizing: 'border-box',
		outline: 'none',
		transition: 'border-color 0.2s',
	}
};
