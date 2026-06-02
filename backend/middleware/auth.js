import admin from 'firebase-admin';
import { db } from '../server.js'; // Adjust path according to your workspace structure

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

export const requireAdmin = async (req, res, next) => {
	try {
		// req.user or req.uid should already be populated by your verifyFirebaseToken middleware
		const uid = req.user?.uid || req.uid;

		if (!uid) {
			return res.status(401).json({ error: 'Unauthorized: Missing token credentials.' });
		}

		// Fetch user profile from your registry collection
		const userDoc = await db.collection('users').doc(uid).get();

		// 🔍 DEVELOPMENT DEBUG LOGS
		console.log(`[DEBUG] requireAdmin validation triggered for UID: ${uid}`);
		console.log(`-> Does document exist in Firestore? ${userDoc.exists}`);

		if (!userDoc.exists) {
			return res.status(403).json({ error: 'Forbidden: User profile record not found.' });
		}

		const userData = userDoc.data();
		console.log(`-> Document Payload:`, userData);

		// Safely extract and normalize the role string to lowercase, removing tracking whitespaces
		const userRole = userData?.role?.toLowerCase().trim();
		console.log(`-> Evaluated Role String: "${userRole}"`);

		// Enforce administrative role verification check
		if (userRole !== 'admin') {
			return res.status(403).json({ error: 'Forbidden: Access restricted to Administrators only.' });
		}

		// Authorization verification passed successfully! Proceed to downstream router block.
		next();
	} catch (error) {
		console.error("[ERROR] requireAdmin validation exception:", error);
		return res.status(500).json({ error: 'Internal validation failure.', details: error.message });
	}
};
