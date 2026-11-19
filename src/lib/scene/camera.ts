import { Matrix4, Quaternion, Vector3, type Vector3Tuple } from 'three';
import { planetIds, planets, type PlanetId } from '../data/planets';
import { getSceneLayout } from './layout';

export interface CameraFocus {
	x: number;
	y: number;
	amount: number;
	azimuth: number;
	elevation: number;
	ringView?: number;
	detailRadius?: number;
}

// Move outside the selected planet and look back across the unchanged layout.
const angles: Record<PlanetId, { wide: [number, number]; narrow: [number, number] }> = {
	releases: { wide: [-48, 7], narrow: [-32, 5] },
	about: { wide: [0, -25], narrow: [-12, -15] },
	gigs: { wide: [0, 65], narrow: [0, 18] },
	contact: { wide: [10, 35], narrow: [10, 20] }
};

export function getFocusAngles(id: PlanetId, aspect: number) {
	const narrow = Math.min(1, Math.max(0, (1.2 - aspect) / 0.7));
	const { wide, narrow: portrait } = angles[id];
	return {
		azimuth: ((wide[0] + (portrait[0] - wide[0]) * narrow) * Math.PI) / 180,
		elevation: ((wide[1] + (portrait[1] - wide[1]) * narrow) * Math.PI) / 180
	};
}

export function getCameraView(width: number, height: number, focus: CameraFocus) {
	width = Math.max(1, width);
	height = Math.max(1, height);
	const layout = getSceneLayout(width, height);
	const aspect = width / height;
	const narrow = Math.min(1, Math.max(0, (1.2 - aspect) / 0.7));
	const fov = 45 + (25 - 5 * narrow) * focus.amount;
	const tangent = Math.tan((fov * Math.PI) / 360);
	const target = new Vector3(focus.x * 0.35, focus.y * 0.35, 0);
	const back = new Vector3(
		Math.sin(focus.azimuth) * Math.cos(focus.elevation),
		Math.sin(focus.elevation),
		Math.cos(focus.azimuth) * Math.cos(focus.elevation)
	);
	const right = new Vector3(0, 1, 0).cross(back).normalize();
	const up = back.clone().cross(right);
	// Phone overview scrolls vertically; its scale is determined by width, not by fitting all planets.
	// Detail views frame the selected planet, with Back returning to the same scroll position.
	if (width <= 700) {
		const pixelsPerUnit = (width - 32) / (3.7 * layout.baseScale + 0.35);
		const overviewDistance = height / (2 * tangent * Math.max(1, pixelsPerUnit)) + 0.6;
		const horizontal = tangent * aspect * Math.max(0.25, 1 - 32 / width);
		const vertical = tangent * Math.max(0.25, 1 - 300 / height);
		const detailDistance = (focus.detailRadius ?? 2.9) / Math.min(horizontal, vertical);
		const distance = overviewDistance + (detailDistance - overviewDistance) * focus.amount;
		target.set(focus.x, focus.y, 0).addScaledVector(up, -0.08 * distance * tangent * focus.amount);
		const position = target.clone().addScaledVector(back, distance);
		return {
			position: position.toArray() as Vector3Tuple,
			quaternion: new Quaternion()
				.setFromRotationMatrix(new Matrix4().lookAt(position, target, new Vector3(0, 1, 0)))
				.toArray(),
			fov,
			zoom: pixelsPerUnit
		};
	}
	const horizontal = tangent * aspect * Math.max(0.25, 1 - 48 / width);
	const top = tangent * Math.max(0.25, 1 - 230 / height);
	const bottom = tangent * Math.max(0.25, 1 - 140 / height);
	const planes = [
		back.clone().addScaledVector(right, 1 / horizontal),
		back.clone().addScaledVector(right, -1 / horizontal),
		back.clone().addScaledVector(up, 1 / top),
		back.clone().addScaledVector(up, -1 / bottom),
		back
	];

	// Fit each planet's bounds to the view, including its maximum hover scale.
	// Refit throughout the flight so switching sides does not lose the other planets.
	function fitDistance(lookAt: Vector3) {
		let distance = 1;
		for (const id of planetIds) {
			const planet = planets[id];
			const center = new Vector3(...layout.positions[id]).sub(lookAt);
			if (id === 'about') center.y += 0.225;
			const extent = planet.bounds.map((value) => value * 1.5 + 0.12);
			for (const normal of planes) {
				const support = Math.hypot(
					extent[0] * normal.x,
					extent[1] * normal.y,
					extent[2] * normal.z
				);
				distance = Math.max(distance, center.dot(normal) + support + 0.1);
			}
		}
		return distance;
	}
	let distance = fitDistance(target);
	const overviewZoom = Math.max(
		0.01,
		Math.min((width - 48) / layout.width, (height - 48) / layout.height)
	);
	const overviewDistance = 1.5 + height / (2 * overviewZoom * Math.tan(Math.PI / 8));
	distance = Math.max(distance, overviewDistance + (distance - overviewDistance) * focus.amount);
	// Give the event rings their own reading distance, especially on narrow screens.
	const ringView = focus.ringView ?? 0;
	if (ringView > 0) {
		const ringRadius = 1.85 * 1.5 + 0.12;
		const reservedHeight = height < 600 ? 190 : 320;
		const vertical = tangent * Math.max(0.25, 1 - reservedHeight / height);
		const ringDistance = ringRadius / Math.min(horizontal, vertical);
		const ringTarget = new Vector3(...layout.positions.gigs).addScaledVector(
			up,
			-0.06 * ringDistance * tangent
		);
		target.lerp(ringTarget, ringView);
		distance += (ringDistance - distance) * ringView;
		// Keep the remaining planets reachable when the rings change the camera's target.
		distance = Math.max(distance, fitDistance(target));
	}
	const position = target.clone().addScaledVector(back, distance);
	const orientation = new Matrix4().lookAt(position, target, new Vector3(0, 1, 0));
	return {
		position: position.toArray() as Vector3Tuple,
		quaternion: new Quaternion().setFromRotationMatrix(orientation).toArray(),
		fov,
		zoom: overviewZoom
	};
}
