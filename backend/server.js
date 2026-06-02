import express from 'express';
import admin from 'firebase-admin';

const app = express();
app.use(express.json()); // Essential to parse JSON request bodies from React

const PORT = process.env.PORT || 5000;

// 1. Force SDK to route queries onto local Emulators when running in Docker
// Firebase Admin SDK automatically intercepts these specific environment variables.
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
	console.log(`[MiniHCM] Routing Firebase Admin traffic natively to Emulators:`);
	console.log(` -> Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
	console.log(` -> Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

	// When using local emulators, we can pass a dummy project ID without a real credential file
	admin.initializeApp({ projectId: "mini-hcm-b2108" });
} else {
	// Production Fallback
	admin.initializeApp({
		credential: admin.credential.applicationDefault()
	});
}

const db = admin.firestore()


// Sanity Check Endpoint
app.get('/api/sanity-check', (req, res) => {
	return res.json({
		status: 'healthy',
		message: 'HCM Backend is online and active!',
		port: PORT,
	});
});

/**
 * 2. USER REGISTRATION ENDPOINT
 * POST /api/auth/register
 */
app.post('/api/auth/register', async (req, res) => {
	try {
		const { email, password, name, role, timezone, schedule } = req.body;

		// Validation for required document assignment criteria
		if (!email || !password || !name || !role || !timezone || !schedule) {
			return res.status(400).json({
				error: "Missing required fields. Please provide email, password, name, role, timezone, and schedule."
			});
		}
		if (!schedule.start || !schedule.end) {
			return res.status(400).json({ error: "Schedule must contain both a 'start' and 'end' time." });
		}

		// A. Register Identity securely inside Firebase Auth Engine
		const userRecord = await admin.auth().createUser({
			email: email,
			password: password,
			displayName: name,
		});

		// B. Structure profile and constraints in Firestore 'users' collection
		const userProfile = {
			uid: userRecord.uid,
			name: name,
			email: email,
			role: role,
			timezone: timezone,
			schedule: {
				start: schedule.start, // e.g., "09:00"
				end: schedule.end      // e.g., "18:00"
			},
			createdAt: admin.firestore.FieldValue.serverTimestamp()
		};

		await db.collection('users').doc(userRecord.uid).set(userProfile);

		const clientResponseDate = new Date().toISOString();

		return res.status(201).json({
			message: "User successfully registered!",
			userId: userRecord.uid,
			profile: {
				...userProfile,
				createdAt: clientResponseDate
			}
		});

	} catch (error) {
		console.error("Registration error details:", error);
		return res.status(500).json({
			error: "Registration failed",
			details: error.message
		});
	}
});

/**
 * 3. TOKEN AUTHENTICATION VERIFICATION ENDPOINT
 * POST /api/auth/verify-token
 * Frontend React apps receive an ID token from Firebase upon login.
 * This endpoint verifies that token and retrieves the backend profile.
 */
app.post('/api/auth/verify-token', async (req, res) => {
	try {
		const { idToken } = req.body;

		if (!idToken) {
			return res.status(400).json({ error: "No ID Token provided." });
		}

		// Validate token integrity via Admin SDK auth subsystem
		const decodedToken = await admin.auth().verifyIdToken(idToken);
		const uid = decodedToken.uid;

		// Fetch corresponding application settings and schedule allocations
		const userDoc = await db.collection('users').doc(uid).get();

		if (!userDoc.exists) {
			return res.status(404).json({ error: "User metadata record not found in Firestore." });
		}

		return res.json({
			message: "Token is authentic and verified!",
			user: userDoc.data()
		});

	} catch (error) {
		console.error("Token verification error details:", error);
		return res.status(401).json({
			error: "Unauthorized: Invalid or expired token",
			details: error.message
		});
	}
});

app.listen(PORT, () => {
	console.log(`[MiniHCM] Active on internal port ${PORT}`);
});
