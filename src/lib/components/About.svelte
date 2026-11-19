<script lang="ts">
	import { T } from '@threlte/core';
	import { Edges, HTML } from '@threlte/extras';
	import { Quaternion, TetrahedronGeometry, Vector3 } from 'three';
	import type { PlanetProps } from '../data/planets';
	import PlanetFrame from './PlanetFrame.svelte';
	import AboutTextOrbits from './AboutTextOrbits.svelte';

	let {
		position,
		focused = false,
		compact = false,
		baseScale = 1,
		onselect
	}: PlanetProps = $props();

	const radius = 0.9;
	// Orient the geometry before Edges reads it: face +Z, tip pointing up.
	const geometry = new TetrahedronGeometry(radius, 0)
		.rotateX(Math.PI / 4)
		.rotateY(Math.atan(1 / Math.sqrt(2)))
		.rotateZ(Math.PI / 2);
	// The geometry's top vertex is tilted away from local Y. Its axis passes
	// through the origin and the opposite face's center in a regular tetrahedron.
	const vertices = geometry.getAttribute('position');
	const apex = new Vector3().fromBufferAttribute(vertices, 0);
	for (let index = 1; index < vertices.count; index++) {
		if (vertices.getY(index) > apex.y) apex.fromBufferAttribute(vertices, index);
	}
	const bodyOrientation = new Quaternion()
		.setFromUnitVectors(apex.normalize(), new Vector3(0, 1, 0))
		.toArray();
</script>

<PlanetFrame
	id="about"
	{position}
	{focused}
	{compact}
	{baseScale}
	showShortcut={false}
	{onselect}
	from="bottom"
	delay={0.65}
	phase={2.1}
	floatAmount={0.04}
	upright
>
	<T.Group rotation={[0, -Math.PI / 4, 0]}>
		<T.Group quaternion={bodyOrientation}>
			<T.Mesh>
				<T is={geometry} />
				<T.MeshStandardMaterial color="#ff0000" toneMapped={false} />
				<Edges color="black" />
				<HTML transform position={[0, -0.27, radius / 3 + 0.001]} distanceFactor={1}>
					<button
						type="button"
						class="label"
						aria-label="View about"
						aria-pressed={focused}
						onclick={(event) => {
							event.stopPropagation();
							onselect?.();
						}}>About</button
					>
				</HTML>
			</T.Mesh>
		</T.Group>
		<AboutTextOrbits />
	</T.Group>
</PlanetFrame>

<style>
	.label {
		padding: 0;
		border: 0;
		background: none;
		color: white;
		cursor: pointer;
		font:
			100 90px / 1 system-ui,
			sans-serif;
		white-space: nowrap;
		user-select: none;
	}

	.label:focus-visible {
		outline: 3px solid white;
		outline-offset: 8px;
	}
</style>
