<script>
	import { T, useTask } from '@threlte/core';
	import { Billboard, useTexture } from '@threlte/extras';
	import { prefersReducedMotion } from 'svelte/motion';
	import { releaseCovers } from '../data/releases';

	const textures = useTexture(releaseCovers.map((release) => release.cover));
	const orbitRadius = 1.2;
	const orbitDuration = 60;
	const orbitInclination = (7 * Math.PI) / 12;
	// Keep each cover's orbit stable while varying its radius, plane and speed.
	const orbits = releaseCovers.map((_, index) => ({
		radius: orbitRadius * (1.1 + Math.sin(index * 2.4 + 0.6) * 0.14),
		inclination: orbitInclination + Math.sin(index * 1.7 + 0.6) * 0.3,
		roll: Math.sin(index * 2.1) * 0.25,
		duration: orbitDuration + Math.sin(index * 1.3) * 10,
		phase: (index / releaseCovers.length) * Math.PI * 2 + 0.4 + Math.sin(index * 1.9) * 0.18
	}));
	let elapsed = $state(0);

	useTask(
		(delta) => {
			if (!document.hidden) elapsed += Math.min(delta, 0.05);
		},
		{ running: () => !prefersReducedMotion.current }
	);
</script>

{#if $textures}
	{#each releaseCovers as release, index (release.url)}
		{@const orbit = orbits[index]}
		{@const angle = (elapsed / orbit.duration) * Math.PI * 2 + orbit.phase}
		<T.Group rotation={[orbit.inclination, 0, orbit.roll]}>
			<Billboard position={[Math.cos(angle) * orbit.radius, Math.sin(angle) * orbit.radius, 0]}>
				<T.Mesh name={`release-cover:${release.title}`} rotation.z={Math.sin(angle) * 0.08}>
					<T.PlaneGeometry args={[0.3, 0.3]} />
					<T.MeshBasicMaterial map={$textures[index]} toneMapped={false} />
				</T.Mesh>
			</Billboard>
		</T.Group>
	{/each}
{/if}
