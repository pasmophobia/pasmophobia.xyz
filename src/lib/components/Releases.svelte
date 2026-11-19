<script lang="ts">
	import { T } from '@threlte/core';
	import { Edges, HTML } from '@threlte/extras';
	import type { PlanetProps } from '../data/planets';
	import PlanetFrame from './PlanetFrame.svelte';
	import ReleaseSatellites from './ReleaseSatellites.svelte';

	let {
		position,
		focused = false,
		compact = false,
		baseScale = 1,
		onselect
	}: PlanetProps = $props();
</script>

<PlanetFrame
	id="releases"
	{position}
	{focused}
	{compact}
	{baseScale}
	showShortcut={false}
	{onselect}
	from="left"
	delay={0.15}
	phase={0.4}
>
	<T.Mesh rotation.x={Math.PI / 16} rotation.y={-Math.PI / 16}>
		<T.BoxGeometry args={[1, 1, 1]} />
		<T.MeshStandardMaterial color="#0000ff" toneMapped={false} />
		<Edges color="black" />
		<HTML transform position={[0, -0.35, 0.501]} distanceFactor={1}>
			<button
				type="button"
				class="box-label"
				aria-label="View releases"
				aria-pressed={focused}
				onclick={(event) => {
					event.stopPropagation();
					onselect?.();
				}}>Releases</button
			>
		</HTML>
	</T.Mesh>
	<ReleaseSatellites />
</PlanetFrame>

<style>
	.box-label {
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

	.box-label:focus-visible {
		outline: 3px solid white;
		outline-offset: 8px;
	}
</style>
