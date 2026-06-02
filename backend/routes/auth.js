import express from 'express';
import admin from 'firebase-admin';
import { db } from '../server.js'; // Adjust based on your directory layout

const router = express.Router();

/**
 * POST /api/auth/login
 * Public endpoint to sign in and fetch user profile metadata
 */
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required." });
		}

		const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyFakeKeyForEmulator";
		let signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

		if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
			signInUrl = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
		}

		const response = await fetch(signInUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password, returnSecureToken: true })
		});

		const data = await response.json();

		if (!response.ok) {
			return res.status(response.status).json({
				error: "Authentication failed",
				details: data.error?.message || "Invalid credentials"
			});
		}

		const uid = data.localId;
		const userDoc = await db.collection('users').doc(uid).get();

		if (!userDoc.exists) {
			return res.status(404).json({ error: "User authenticated, but profile missing from Firestore." });
		}

		return res.json({
			message: "Login successful!",
			idToken: data.idToken,
			refreshToken: data.refreshToken,
			user: userDoc.data()
		});

	} catch (error) {
		console.error("Login error details:", error);
		return res.status(500).json({ error: "Internal server error during login", details: error.message });
	}
});

/**
 * POST /api/auth/logout
 * Protected endpoint to clear active authentication states
 */
router.post('/logout', async (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(400).json({ error: 'Bad Request: No active session token provided.' });
		}

		const idToken = authHeader.split('Bearer ')[1];
		const decodedToken = await admin.auth().verifyIdToken(idToken);

		// Invalidate refresh tokens globally
		await admin.auth().revokeRefreshTokens(decodedToken.uid);

		return res.json({
			message: "Logout successful. Application tokens revoked safely."
		});
	} catch (error) {
		console.error("Logout process exception:", error);
		return res.status(500).json({ error: "Internal backend error during logout processing.", details: error.message });
	}
});

export default router;
