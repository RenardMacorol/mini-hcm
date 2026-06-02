import express from 'express';
import { db } from '../server.js';
import { requireAdmin } from '../middleware/auth.js';

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
