import express from 'express';
import { db } from '../server.js'
import { calculateShiftMetrics } from '../utils/attendanceMathHandler.js';

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

export default router;
