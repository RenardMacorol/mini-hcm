import { DateTime } from 'luxon'; // Recommended for robust timezone manipulation

/**
 * Calculates HCM attendance metrics for a single employee shift.
 * All inputs are treated within the user's specific timezone (e.g., 'Asia/Manila').
 */
export function calculateShiftMetrics({ checkInStr, checkOutStr, schedule, timezone }) {
	// 1. Parse timestamps into the user's local timezone
	const punchIn = DateTime.fromISO(checkInStr).setZone(timezone);
	const punchOut = DateTime.fromISO(checkOutStr).setZone(timezone);

	// 2. Parse the static schedule boundaries for that specific day
	const [schedStartH, schedStartM] = schedule.start.split(':').map(Number);
	const [schedEndH, schedEndM] = schedule.end.split(':').map(Number);

	const shiftStart = punchIn.set({ hour: schedStartH, minute: schedStartM, second: 0, millisecond: 0 });
	const shiftEnd = punchIn.set({ hour: schedEndH, minute: schedEndM, second: 0, millisecond: 0 });

	// Total clocked hours
	const totalClockedHours = Math.max(0, punchOut.diff(punchIn, 'hours').hours);

	// --- 3. Compute Lateness ---
	// Late if punch-in happens after the scheduled shift start
	let latenessMinutes = 0;
	if (punchIn > shiftStart) {
		latenessMinutes = punchIn.diff(shiftStart, 'minutes').minutes;
	}

	// --- 4. Compute Undertime ---
	// Undertime if punch-out happens before the scheduled shift end
	let undertimeMinutes = 0;
	if (punchOut < shiftEnd) {
		undertimeMinutes = shiftEnd.diff(punchOut, 'minutes').minutes;
	}

	// --- 5. Compute Regular Hours & Overtime ---
	// Work done within the boundaries of the scheduled shift
	const workStartInsideShift = punchIn < shiftStart ? shiftStart : punchIn;
	const workEndInsideShift = punchOut > shiftEnd ? shiftEnd : punchOut;

	let regularHours = 0;
	if (workEndInsideShift > workStartInsideShift) {
		regularHours = workEndInsideShift.diff(workStartInsideShift, 'hours').hours;
	}

	// Overtime: Hours worked explicitly beyond the scheduled shift parameter
	let overtimeHours = 0;
	if (punchOut > shiftEnd) {
		// If they checked in late, OT only accrues after shiftEnd
		const otStart = punchIn > shiftEnd ? punchIn : shiftEnd;
		overtimeHours = punchOut.diff(otStart, 'hours').hours;
	}

	// --- 6. Compute Night Differential (ND) ---
	// Any hours clocked between 22:00 (10 PM) and 06:00 (6 AM) the following day
	let nightDiffHours = calculateNightDifferential(punchIn, punchOut, timezone);

	return {
		totalClockedHours: parseFloat(totalClockedHours.toFixed(2)),
		regularHours: parseFloat(regularHours.toFixed(2)),
		overtimeHours: parseFloat(overtimeHours.toFixed(2)),
		nightDiffHours: parseFloat(nightDiffHours.toFixed(2)),
		latenessMinutes: Math.round(latenessMinutes),
		undertimeMinutes: Math.round(undertimeMinutes)
	};
}

function calculateNightDifferential(punchIn, punchOut, timezone) {
	let ndHours = 0;
	let current = punchIn;

	// Evaluate hour by hour chunks for precise cross-over capturing
	while (current < punchOut) {
		const nextHour = current.plus({ hours: 1 });
		const endOfChunk = nextHour > punchOut ? punchOut : nextHour;
		const chunkFraction = endOfChunk.diff(current, 'hours').hours;

		const hourOfDay = current.setZone(timezone).hour;

		// ND window: 22:00 to 06:00
		if (hourOfDay >= 22 || hourOfDay < 6) {
			ndHours += chunkFraction;
		}
		current = nextHour;
	}
	return ndHours;
}
