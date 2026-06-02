import express from 'express';
import { db } from '../server.js'
import { calculateShiftMetrics } from '../utils/attendanceMathHandler.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();


router.post('/punch', async (req, res) => {
	try {
		const { uid } = req.user;
		const { type } = req.body;

		if (!['IN', 'OUT'].includes(type)) {
			return res.status(400).json({ error: 'Invalid punch type. Must be IN or OUT.' });
		}

		const serverTimestamp = new Date();
		const userRef = db.collection('users').doc(uid);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return res.status(404).json({ error: 'User registration records not found in system.' });
		}

		const userData = userDoc.data();
		const { schedule, timezone = 'Asia/Manila' } = userData;
		const todayStr = serverTimestamp.toLocaleDateString('en-CA', { timeZone: timezone });
		const attendanceRef = db.collection('attendance');

		if (type === 'IN') {
			const newPunch = {
				userId: uid,
				date: todayStr,
				punchIn: serverTimestamp.toISOString(),
				punchOut: null,
				status: 'ACTIVE',
				metrics: null
			};

			const docRef = await attendanceRef.add(newPunch);
			return res.status(201).json({
				message: 'Punch-In recorded successfully!',
				punchId: docRef.id,
				timestamp: newPunch.punchIn
			});

		} else if (type === 'OUT') {
			const activePunchQuery = await attendanceRef
				.where('userId', '==', uid)
				.where('status', '==', 'ACTIVE')
				.limit(1)
				.get();

			if (activePunchQuery.empty) {
				return res.status(400).json({ error: 'No active Punch-In record found. You must punch in first.' });
			}

			const punchDoc = activePunchQuery.docs[0];
			const punchData = punchDoc.data();
			const punchInStr = punchData.punchIn;
			const punchOutStr = serverTimestamp.toISOString();

			const computedMetrics = calculateShiftMetrics({
				checkInStr: punchInStr,
				checkOutStr: punchOutStr,
				schedule,
				timezone
			});

			await punchDoc.ref.update({
				punchOut: punchOutStr,
				status: 'COMPLETED',
				metrics: computedMetrics
			});

			const summaryRef = db.collection('dailySummary').doc(`${uid}_${todayStr}`);

			// Executing the atomicity guard via db transaction
			await db.runTransaction(async (transaction) => {
				const summaryDoc = await transaction.get(summaryRef);

				if (!summaryDoc.exists) {
					transaction.set(summaryRef, {
						userId: uid,
						date: todayStr,
						regularHours: computedMetrics.regularHours,
						overtimeHours: computedMetrics.overtimeHours,
						nightDiffHours: computedMetrics.nightDiffHours,
						latenessMinutes: computedMetrics.latenessMinutes,
						undertimeMinutes: computedMetrics.undertimeMinutes,
						updatedAt: serverTimestamp.toISOString()
					});
				} else {
					const currentSummary = summaryDoc.data();
					transaction.update(summaryRef, {
						regularHours: parseFloat((currentSummary.regularHours + computedMetrics.regularHours).toFixed(2)),
						overtimeHours: parseFloat((currentSummary.overtimeHours + computedMetrics.overtimeHours).toFixed(2)),
						nightDiffHours: parseFloat((currentSummary.nightDiffHours + computedMetrics.nightDiffHours).toFixed(2)),
						latenessMinutes: currentSummary.latenessMinutes + computedMetrics.latenessMinutes,
						undertimeMinutes: currentSummary.undertimeMinutes + computedMetrics.undertimeMinutes,
						updatedAt: serverTimestamp.toISOString()
					});
				}
			});

			return res.status(200).json({
				message: 'Punch-Out processed and verified!',
				metrics: computedMetrics
			});
		}

	} catch (error) {
		console.error('Punch endpoint error:', error);
		return res.status(500).json({ error: 'Internal server processing failure.' });
	}
});

/**
 * GET /api/attendance/my-summary
 * Fetches the historical trailing daily summaries for the logged-in employee.
 * Used for user dashboard KPIs and personal history tables.
 */
router.get('/my-summary', async (req, res) => {
	try {
		const { uid } = req.user; // Securely extracted from your auth middleware

		// Query the dailySummary collection filtered by the user's ID
		const summarySnapshot = await db.collection('dailySummary')
			.where('userId', '==', uid)
			.orderBy('date', 'desc')
			.limit(30) // Limits return payload to the past month of logs
			.get();

		const historicalData = [];
		summarySnapshot.forEach(doc => {
			historicalData.push({ id: doc.id, ...doc.data() });
		});

		return res.status(200).json({
			status: 'success',
			count: historicalData.length,
			data: historicalData
		});

	} catch (error) {
		console.error('[MiniHCM Error] Failed to fetch personal summaries:', error);
		return res.status(500).json({ error: 'Could not retrieve your summary history logs.' });
	}
});

/**
 * GET /api/attendance/admin/global-summary
 * Admin Tools: Allows administrators/HR roles to view daily aggregates across all employees.
 */
router.get('/admin/global-summary', async (req, res) => {
	try {
		const { uid } = req.user; // Securely extracted from your auth middleware

		// Security Gate: Check if the requesting user actually has an 'admin' role in Firestore
		const userCheckDoc = await db.collection('users').doc(uid).get();

		if (!userCheckDoc.exists || userCheckDoc.data().role.toLowerCase() !== 'admin') {
			return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
		}

		// Fetch all summary aggregated records sorted by most recent date
		const globalSnapshot = await db.collection('dailySummary')
			.orderBy('date', 'desc')
			.get();

		const administrativeReport = [];
		globalSnapshot.forEach(doc => {
			administrativeReport.push({ id: doc.id, ...doc.data() });
		});

		return res.status(200).json({
			status: 'success',
			count: administrativeReport.length,
			data: administrativeReport
		});

	} catch (error) {
		console.error('[MiniHCM Error] Administrative global summary fetch failed:', error);
		return res.status(500).json({ error: 'Failed to safely query master payroll matrices logs.' });
	}
});

/**
 * 1. ADMIN: VIEW ALL PUNCHES
 * GET /api/attendance/admin/punches
 */
router.get('/admin/punches', requireAdmin, async (req, res) => {
	try {
		const { userId, date } = req.query;
		let query = db.collection('attendance');

		if (userId) query = query.where('userId', '==', userId);
		if (date) query = query.where('date', '==', date); // Format: YYYY-MM-DD

		const snapshot = await query.orderBy('timestamp', 'desc').get();
		const punches = [];

		snapshot.forEach(doc => {
			punches.push({ id: doc.id, ...doc.data() });
		});

		return res.json({ success: true, count: punches.length, data: punches });
	} catch (error) {
		return res.status(500).json({ error: 'Failed to retrieve attendance logs.', details: error.message });
	}
});

/**
 * 2. ADMIN: EDIT AN EMPLOYEE PUNCH
 * PUT /api/attendance/admin/punch/:id
 */
router.put('/admin/punch/:id', requireAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const { updatedFields } = req.body; // e.g., { timestamp: "...", type: "IN"/"OUT" }

		if (!updatedFields) {
			return res.status(400).json({ error: 'Missing updated field payload.' });
		}

		const punchRef = db.collection('attendance').doc(id);
		const punchDoc = await punchRef.get();

		if (!punchDoc.exists) {
			return res.status(404).json({ error: 'Punch log record not found.' });
		}

		// Update fields and log an audit trail note
		await punchRef.update({
			...updatedFields,
			lastEditedBy: req.user?.uid || 'admin',
			editedAt: new Date().toISOString()
		});

		return res.json({ success: true, message: `Punch record ${id} modified successfully.` });
	} catch (error) {
		return res.status(500).json({ error: 'Failed to update punch log.', details: error.message });
	}
});

/**
 * 3. ADMIN: VIEW DAILY REPORTS (ALL EMPLOYEES)
 * GET /api/attendance/admin/daily-report
 */
router.get('/admin/daily-report', requireAdmin, async (req, res) => {
	try {
		const { date } = req.query; // Expects YYYY-MM-DD
		if (!date) {
			return res.status(400).json({ error: 'Target query date parameter required (YYYY-MM-DD).' });
		}

		// Fetch summaries matching the target date across all users
		const snapshot = await db.collection('dailySummary')
			.get();

		const reports = [];
		snapshot.forEach(doc => {
			const data = doc.data();
			// Parse out the date from document ID layout: {uid}_{YYYY-MM-DD}
			const docIdParts = doc.id.split('_');
			const docDate = docIdParts[1];
			const employeeUid = docIdParts[0];

			if (docDate === date) {
				reports.push({
					userId: employeeUid,
					regularHours: data.regularHours || 0,
					overtime: data.overtime || 0,
					nightDifferential: data.nightDifferential || 0,
					lateness: data.lateness || 0,
					undertime: data.undertime || 0,
					lastUpdated: data.lastUpdated
				});
			}
		});

		return res.json({ success: true, date, count: reports.length, data: reports });
	} catch (error) {
		return res.status(500).json({ error: 'Failed to extract daily dashboard metrics matrix.', details: error.message });
	}
});

/**
 * 4. ADMIN: VIEW WEEKLY REPORTS (ALL EMPLOYEES)
 * GET /api/attendance/admin/weekly-report
 */
router.get('/admin/weekly-report', requireAdmin, async (req, res) => {
	try {
		const { startOfWeek } = req.query; // Expects YYYY-MM-DD (e.g. Mon or Sun baseline)
		if (!startOfWeek) {
			return res.status(400).json({ error: 'Missing startOfWeek query parameter (YYYY-MM-DD).' });
		}

		// Calculate dates array for the entire 7-day work week cycle
		const baseDate = new Date(startOfWeek);
		const validDates = [];
		for (let i = 0; i < 7; i++) {
			const target = new Date(baseDate);
			target.setDate(baseDate.getDate() + i);
			validDates.push(target.toISOString().split('T')[0]);
		}

		const snapshot = await db.collection('dailySummary').get();
		const userWeeklyRollup = {};

		snapshot.forEach(doc => {
			const data = doc.data();
			const [uid, dateStr] = doc.id.split('_');

			// If the record falls inside the requested week range
			if (validDates.includes(dateStr)) {
				if (!userWeeklyRollup[uid]) {
					userWeeklyRollup[uid] = {
						userId: uid,
						regularHours: 0,
						overtime: 0,
						nightDifferential: 0,
						lateness: 0,
						undertime: 0,
						daysWorked: 0
					};
				}

				userWeeklyRollup[uid].regularHours += data.regularHours || 0;
				userWeeklyRollup[uid].overtime += data.overtime || 0;
				userWeeklyRollup[uid].nightDifferential += data.nightDifferential || 0;
				userWeeklyRollup[uid].lateness += data.lateness || 0;
				userWeeklyRollup[uid].undertime += data.undertime || 0;
				userWeeklyRollup[uid].daysWorked += 1;
			}
		});

		return res.json({
			success: true,
			weekStarting: startOfWeek,
			data: Object.values(userWeeklyRollup)
		});
	} catch (error) {
		return res.status(500).json({ error: 'Failed to process weekly matrix calculation rolling summary.', details: error.message });
	}
});


export default router;
