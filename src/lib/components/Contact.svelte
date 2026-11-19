<script lang="ts">
	import { T } from '@threlte/core';
	import { Edges, HTML } from '@threlte/extras';
	import type { PlanetProps } from '../data/planets';
	import PlanetFrame from './PlanetFrame.svelte';

	let {
		position,
		focused = false,
		compact = false,
		baseScale = 1,
		onselect
	}: PlanetProps = $props();

	const radius = 0.4;
</script>

<PlanetFrame
	id="contact"
	{position}
	{focused}
	{compact}
	{baseScale}
	{onselect}
	from="top"
	delay={0.9}
	phase={5.2}
	floatAmount={0.06}
>
	<T.Mesh rotation.x={Math.PI / 8} rotation.y={Math.PI / 4}>
		<T.OctahedronGeometry args={[radius, 0]} />
		<T.MeshStandardMaterial color="#ffff00" toneMapped={false} />
		<Edges color="black" />
	</T.Mesh>
	{#if !compact}
		<HTML transform position.y={radius + 0.2} distanceFactor={1}>
			<button
				type="button"
				class="label"
				aria-label="View contact"
				aria-pressed={focused}
				onclick={(event) => {
					event.stopPropagation();
					onselect?.();
				}}>Contact</button
			>
		</HTML>
	{/if}
</PlanetFrame>

<style>
	.label {
		padding: 0;
		border: 0;
		background: none;
		color: #111;
		cursor: pointer;
		font:
			100 45px / 1 system-ui,
			sans-serif;
		white-space: nowrap;
		user-select: none;
	}

	@media (max-width: 700px) {
		.label {
			font-size: 72px;
		}
	}
</style>
