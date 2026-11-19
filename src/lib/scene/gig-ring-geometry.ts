import { BufferGeometry, Float32BufferAttribute } from 'three';

export interface RingLetter {
	glyph: string;
	x: number;
	y: number;
	rotation: number;
	width: number;
}

/** Keep both drawing and picking confined to the letters, leaving the ring's gaps open. */
export function createGigRingGeometry(
	letters: RingLetter[],
	fontSize: number,
	diameter: number,
	pixelsPerUnit: number
) {
	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];
	for (const letter of letters) {
		if (!letter.glyph.trim()) continue;
		const halfWidth = (letter.width + 2) / 2;
		const halfHeight = fontSize * 0.68;
		const cosine = Math.cos(letter.rotation);
		const sine = Math.sin(letter.rotation);
		const start = positions.length / 3;
		for (const [x, y] of [
			[-halfWidth, -halfHeight],
			[halfWidth, -halfHeight],
			[halfWidth, halfHeight],
			[-halfWidth, halfHeight]
		]) {
			const pixelX = letter.x + x * cosine - y * sine;
			const pixelY = letter.y + x * sine + y * cosine;
			positions.push(
				(pixelX - diameter / 2) / pixelsPerUnit,
				(diameter / 2 - pixelY) / pixelsPerUnit,
				0
			);
			uvs.push(pixelX / diameter, 1 - pixelY / diameter);
		}
		indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
	geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	return geometry;
}
