import express from 'express';
import admin from 'firebase-admin';

const app = express();
app.use(express.json()); // Essential to parse JSON request bodies from React

const PORT = process.env.PORT || 5000;
const IS_EMULATOR_READY = process.env.IS_EMULATOR_READY === 'true';

// ==========================================
// 1. INITIALIZE FIREBASE ADMIN SDK
// ==========================================
if (IS_EMULATOR_READY) {
	// Tell the Admin SDK to direct traffic to your Docker Emulator container
	// Matches your compose mapping (typically port 8081 for firestore emulator)
	process.env.FIRESTORE_EMULATOR_HOST = 'firebase-emulator:8081';

	admin.initializeApp({
		projectId: 'mini-hcm-dev' // Must match your firebase.json setup
	});
	console.log("[MiniHCM] Node.js successfully routed to Firestore Emulator.");
} else {
	// Fallback or Production Initializer
	admin.initializeApp();
}

const db = admin.firestore();

// ==========================================
// 2. CORE TIME-TRACKING COMPUTATION ENDPOINT
// ==========================================
app.post('/api/attendance/punch', async (req, res) => {
	try {
		// React sends the authenticated user token, type of action, and timestamp
		const { idToken, type } = req.body;

		if (!idToken || !type) {
			return res.status(400).json({ error: "Missing required punch parameters." });
		}

		// Verify token from frontend to securely get the User ID (UID)
		const decodedToken = await admin.auth().verifyIdToken(idToken);
		const userId = decodedToken.uid;

		// Use trusted server side clock to prevent frontend clock tampering
		const punchTime = new Date();

		if (!IS_EMULATOR_READY) {
			console.log("Emulator flagged offline: short-circuiting write");
			return res.json({ status: "mock-success", message: "Mock punch logged!" });
		}

		// A. Fetch Employee Schedule Profile from Firestore
		const userDoc = await db.collection('users').doc(userId).get();
		if (!userDoc.exists) {
			return res.status(404).json({ error: "Employee profile configuration not found." });
		}

		const userData = userDoc.data();
		const schedule = userData.schedule; // e.g., { start: '09:00', end: '18:00' }

		// B. Save raw punch event into 'attendance' collection
		const attendanceRef = db.collection('attendance').doc();
		await attendanceRef.set({
			userId,
			type, // 'in' or 'out'
			timestamp: admin.firestore.FieldValue.serverTimestamp()
		});

		// C. Calculate Metrics (If type is 'out', process the full day shifts)
		if (type === 'out') {
			// Find corresponding 'in' punch for today to calculate total durations
			const todayStart = new Date(punchTime.setHours(0, 0, 0, 0));

			const punchInSnapshot = await db.collection('attendance')
				.where('userId', '==', userId)
				.where('type', '==', 'in')
				.where('timestamp', '>=', todayStart)
				.orderBy('timestamp', 'desc')
				.limit(1)
				.get();

			if (!punchInSnapshot.empty) {
				const punchInDate = punchInSnapshot.docs[0].data().timestamp.toDate();
				const punchOutDate = new Date(); // Current server time

				// --- Placeholder calculation rules for HCM ---
				let regularHours = 8;
				let overtime = 0;
				let nightDifferential = 0;
				let late = 0;
				let undertime = 0;

				// TODO: Apply calculation math based on your schedule variables
				// Compare punchInDate vs schedule.start to calculate late
				// Compare punchOutDate vs schedule.end to calculate undertime/overtime
				// Check hours between 22:00 and 06:00 for night differential

				// D. Update or Create the daily aggregate summary doc
				const dateKey = punchOutDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
				await db.collection('dailySummary').doc(`${userId}_${dateKey}`).set({
					userId,
					date: dateKey,
					regularHours,
					overtime,
					nightDifferential,
					late,
					undertime,
					lastUpdated: admin.firestore.FieldValue.serverTimestamp()
				});
			}
		}

		return res.json({ status: "success", msg: `Punch-${type} recorded cleanly.` });

	} catch (error) {
		console.error("Punch API error:", error);
		return res.status(500).json({ error: "Internal Server Processing Error." });
	}
});

// ==========================================
// HEALTH AND SANITY CHECKS
// ==========================================
app.get('/api/sanity-check', (req, res) => {
	return res.json({ source: 'sanity-check', data: `[MiniHCM] Backend service online on port ${PORT}` });
});

app.listen(PORT, () => {
	console.log(`[MiniHCM] Active on internal port ${PORT}`);
});
