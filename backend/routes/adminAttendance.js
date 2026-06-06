import { db } from '../server.js';
import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { calculateShiftMetrics } from '../utils/attendanceMathHandler.js';
const router = express.Router();

// Universal Security Guard - applies to all endpoints defined below in this file
router.use(requireAdmin);

/**
 * GET /api/admin/attendance/global-summary
 * Allows administrators/HR roles to view daily aggregates across all employees.
 */
router.get('/global-summary', async (req, res) => {
	try {
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
 * GET /api/admin/users
 * Returns all employee profiles for name resolution
 */
router.get('/users', async (req, res) => {
	try {
		const snapshot = await db.collection('users').get();
		const users = [];
		snapshot.forEach(doc => {
			const { name, email, role } = doc.data();
			users.push({ uid: doc.id, name, email, role });
		});
		return res.json({ success: true, data: users });
	} catch (error) {
		return res.status(500).json({ error: 'Failed to fetch users.' });
	}
});
/**
 * GET /api/admin/attendance/punches
 * VIEW ALL PUNCHES (Filter optional by user or calendar date)
 */
router.get('/punches', async (req, res) => {
	try {
		const { userId, date } = req.query;
		let query = db.collection('attendance');

		if (userId) query = query.where('userId', '==', userId);
		if (date) query = query.where('date', '==', date);

		const snapshot = await query.orderBy('punchIn', 'desc').get();
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
 * PUT /api/admin/attendance/punch/:id
 * EDIT AN EMPLOYEE PUNCH
 */
router.put('/punch/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { updatedFields } = req.body;

		if (!updatedFields) {
			return res.status(400).json({ error: 'Missing updated field payload.' });
		}

		const punchRef = db.collection('attendance').doc(id);
		const punchDoc = await punchRef.get();

		if (!punchDoc.exists) {
			return res.status(404).json({ error: 'Punch log record not found.' });
		}

		const existingData = punchDoc.data();

		// Check if admin is editing timestamps (requires recalc)
		// or just overriding metrics directly (no recalc needed)
		const isTimestampEdit = updatedFields.punchIn || updatedFields.punchOut;

		let finalMetrics;

		if (isTimestampEdit) {
			// Recalculate from new timestamps
			const mergedPunch = { ...existingData, ...updatedFields };
			const userDoc = await db.collection('users').doc(mergedPunch.userId).get();
			if (!userDoc.exists) {
				return res.status(404).json({ error: 'Associated user profile not found.' });
			}
			const { schedule, timezone = 'Asia/Manila' } = userDoc.data();
			finalMetrics = calculateShiftMetrics({
				checkInStr: mergedPunch.punchIn,
				checkOutStr: mergedPunch.punchOut,
				schedule,
				timezone,
			});
		} else {
			// ✅ Admin is directly overriding metric values — use them as-is
			finalMetrics = {
				regularHours: updatedFields.regularHours ?? existingData.metrics?.regularHours ?? 0,
				overtimeHours: updatedFields.overtimeHours ?? existingData.metrics?.overtimeHours ?? 0,
				nightDiffHours: updatedFields.nightDiffHours ?? existingData.metrics?.nightDiffHours ?? 0,
				latenessMinutes: updatedFields.latenessMinutes ?? existingData.metrics?.latenessMinutes ?? 0,
				undertimeMinutes: updatedFields.undertimeMinutes ?? existingData.metrics?.undertimeMinutes ?? 0,
				totalClockedHours: existingData.metrics?.totalClockedHours ?? 0,
			};
		}

		// Re-aggregate the daily summary from all completed punches for that day
		const { userId, date } = existingData;
		const summaryDocId = `${userId}_${date}`;
		const summaryRef = db.collection('dailySummary').doc(summaryDocId);

		const dayPunchesSnap = await db.collection('attendance')
			.where('userId', '==', userId)
			.where('date', '==', date)
			.where('status', '==', 'COMPLETED')
			.get();

		let aggregated = {
			regularHours: 0,
			overtimeHours: 0,
			nightDiffHours: 0,
			latenessMinutes: 0,
			undertimeMinutes: 0,
		};

		dayPunchesSnap.forEach((doc) => {
			// Use freshly computed metrics for the edited doc, stored metrics for others
			const m = doc.id === id ? finalMetrics : (doc.data().metrics || {});
			aggregated.regularHours += m.regularHours || 0;
			aggregated.overtimeHours += m.overtimeHours || 0;
			aggregated.nightDiffHours += m.nightDiffHours || 0;
			aggregated.latenessMinutes += m.latenessMinutes || 0;
			aggregated.undertimeMinutes += m.undertimeMinutes || 0;
		});

		aggregated.regularHours = parseFloat(aggregated.regularHours.toFixed(2));
		aggregated.overtimeHours = parseFloat(aggregated.overtimeHours.toFixed(2));
		aggregated.nightDiffHours = parseFloat(aggregated.nightDiffHours.toFixed(2));

		// Writes only inside the transaction
		await db.runTransaction(async (transaction) => {
			transaction.update(punchRef, {
				metrics: finalMetrics,
				lastEditedBy: req.user?.uid || 'admin',
				editedAt: new Date().toISOString(),
			});

			transaction.set(summaryRef, {
				userId,
				date,
				...aggregated,
				updatedAt: new Date().toISOString(),
			}, { merge: false });
		});

		return res.json({ success: true, message: `Punch ${id} updated and summary synced.` });

	} catch (error) {
		console.error('Admin punch edit error:', error);
		return res.status(500).json({ error: 'Failed to update punch log.', details: error.message });
	}
});
/**
 * GET /api/admin/attendance/daily-report
 * VIEW DAILY METRICS REPORTS Across All Employees
 */
router.get('/daily-report', async (req, res) => {
	try {
		const { date } = req.query;
		if (!date) {
			return res.status(400).json({ error: 'Target query date parameter required (YYYY-MM-DD).' });
		}

		const snapshot = await db.collection('dailySummary').get();
		const reports = [];

		snapshot.forEach(doc => {
			const data = doc.data();
			const [employeeUid, docDate] = doc.id.split('_');

			if (docDate === date) {
				reports.push({
					userId: employeeUid,
					regularHours: data.regularHours || 0,
					overtimeHours: data.overtimeHours || 0,
					nightDiffHours: data.nightDiffHours || 0,
					latenessMinutes: data.latenessMinutes || 0,
					undertimeMinutes: data.undertimeMinutes || 0,
					updatedAt: data.updatedAt
				});
			}
		});

		return res.json({ success: true, date, count: reports.length, data: reports });
	} catch (error) {
		return res.status(500).json({ error: 'Failed to extract daily dashboard metrics matrix.', details: error.message });
	}
});

/**
 * GET /api/admin/attendance/weekly-report
 * VIEW WEEKLY AGGREGATE REPORTS Across All Employees
 */
router.get('/weekly-report', async (req, res) => {
	try {
		const { startOfWeek } = req.query;
		if (!startOfWeek) {
			return res.status(400).json({ error: 'Missing startOfWeek query parameter (YYYY-MM-DD).' });
		}

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

			if (validDates.includes(dateStr)) {
				if (!userWeeklyRollup[uid]) {
					userWeeklyRollup[uid] = {
						userId: uid,
						regularHours: 0,
						overtimeHours: 0,
						nightDiffHours: 0,
						latenessMinutes: 0,
						undertimeMinutes: 0,
						daysWorked: 0
					};
				}

				userWeeklyRollup[uid].regularHours += data.regularHours || 0;
				userWeeklyRollup[uid].overtimeHours += data.overtimeHours || 0;
				userWeeklyRollup[uid].nightDiffHours += data.nightDiffHours || 0;
				userWeeklyRollup[uid].latenessMinutes += data.latenessMinutes || 0;
				userWeeklyRollup[uid].undertimeMinutes += data.undertimeMinutes || 0;
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
