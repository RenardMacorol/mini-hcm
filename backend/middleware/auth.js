import admin from 'firebase-admin';

export const verifyFirebaseToken = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'Unauthorized: Missing or malformed access token.' });
		}

		const idToken = authHeader.split('Bearer ')[1];

		// In the Firebase Auth Emulator environment, raw UIDs can pass as tokens.
		// The Admin SDK resolves them identically here.
		const decodedToken = await admin.auth().verifyIdToken(idToken);

		// Attach the verified token profile info right onto the request stream
		req.user = decodedToken;
		next();
	} catch (error) {
		console.error('Middleware Token Error:', error.message);
		return res.status(401).json({ error: 'Unauthorized: Invalid token assertion.', details: error.message });
	}
};
