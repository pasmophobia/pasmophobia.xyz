import { describe, expect, it } from 'vitest';
import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Scene, Vector3 } from 'three';
import { createGigRingGeometry } from './gig-ring-geometry';

function makeLetter() {
	return new Mesh(
		createGigRingGeometry(
			[
				{ glyph: 'A', x: 1128, y: 728, rotation: 0, width: 20 },
				{ glyph: ' ', x: 728, y: 728, rotation: 0, width: 20 }
			],
			32,
			1456,
			400
		),
		new MeshBasicMaterial({ side: DoubleSide })
	);
}

describe('3D gig ring picking', () => {
	it('picks letters while leaving the center and whitespace open', () => {
		const letter = makeLetter();
		const ray = new Raycaster(new Vector3(1, 0, 5), new Vector3(0, 0, -1));
		expect(ray.intersectObject(letter)).not.toHaveLength(0);
		ray.ray.origin.x = 0;
		expect(ray.intersectObject(letter)).toHaveLength(0);
		letter.geometry.dispose();
		letter.material.dispose();
	});

	it('orders clicks by real depth when another object passes in front or behind', () => {
		const scene = new Scene();
		const letter = makeLetter();
		const blocker = new Mesh(new BoxGeometry(0.3, 0.3, 0.3), new MeshBasicMaterial());
		blocker.position.set(1, 0, 1);
		scene.add(letter, blocker);
		scene.updateMatrixWorld(true);
		const ray = new Raycaster(new Vector3(1, 0, 5), new Vector3(0, 0, -1));
		expect(ray.intersectObjects(scene.children)[0].object).toBe(blocker);
		blocker.position.z = -1;
		scene.updateMatrixWorld(true);
		expect(ray.intersectObjects(scene.children)[0].object).toBe(letter);
		letter.geometry.dispose();
		letter.material.dispose();
		blocker.geometry.dispose();
		blocker.material.dispose();
	});

	it('keeps texture coordinates aligned after a letter rotates', () => {
		const geometry = createGigRingGeometry(
			[{ glyph: '茶', x: 728, y: 328, rotation: Math.PI / 3, width: 32 }],
			32,
			1456,
			400
		);
		const letter = new Mesh(geometry, new MeshBasicMaterial({ side: DoubleSide }));
		const ray = new Raycaster(new Vector3(0, 1, 5), new Vector3(0, 0, -1));
		const hit = ray.intersectObject(letter)[0];
		expect(hit.uv?.x).toBeCloseTo(0.5);
		expect(hit.uv?.y).toBeCloseTo(1 - 328 / 1456);
		geometry.dispose();
		letter.material.dispose();
	});
});
