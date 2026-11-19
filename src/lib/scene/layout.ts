import type { Vector3Tuple } from 'three';
import { planetIds, planets, type PlanetId } from '../data/planets';

const portraitPositions: Record<PlanetId, Vector3Tuple> = {
	releases: [-0.3, 4.5, 0],
	gigs: [0.2, 1.3, 0],
	about: [-0.2, -2.2, 0],
	contact: [0.3, -5.2, 0]
};

export function getSceneLayout(width: number, height: number) {
	const aspect = Math.max(1, width) / Math.max(1, height);
	const progress = Math.min(1, Math.max(0, (1.15 - aspect) / 0.6));
	const portrait = progress * progress * (3 - 2 * progress);
	const verticalStretch = width <= 700 ? 1.4 : 1;
	const positions = Object.fromEntries(
		planetIds.map((id) => {
			const wide = planets[id].position;
			const tall = [...portraitPositions[id]];
			tall[1] *= verticalStretch;
			return [id, wide.map((value, axis) => value + (tall[axis] - value) * portrait)];
		})
	) as Record<PlanetId, Vector3Tuple>;
	return {
		positions,
		portrait,
		baseScale: 1 + 0.3 * portrait,
		width: 10.6 + (5.6 - 10.6) * portrait,
		height: 7.5 + (14 - 7.5) * portrait
	};
}
