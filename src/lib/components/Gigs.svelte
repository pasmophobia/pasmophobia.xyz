<script lang="ts">
	import { T } from '@threlte/core';
	import { HTML, Outlines } from '@threlte/extras';
	import { onMount } from 'svelte';
	import type { PlanetProps } from '../data/planets';
	import PlanetFrame from './PlanetFrame.svelte';
	import GigRings from './GigRings.svelte';

	let {
		position,
		focused = false,
		compact = false,
		baseScale = 1,
		onselect
	}: PlanetProps = $props();

	const radius = 0.7;
	const labelRadius = radius + 0.002;
	const label = 'Gigs';
	const letters = Array.from(label);
	const letterElements: HTMLElement[] = [];
	let angles = $state(letters.map((_, index) => (index - (letters.length - 1) / 2) * 0.2));

	onMount(() => {
		// HTML's distanceFactor=1 maps 400 CSS pixels to one world unit.
		const widths = letterElements.map((element) => element.offsetWidth / 400);
		let offset = -widths.reduce((total, width) => total + width, 0) / 2;
		angles = widths.map((width) => {
			const angle = (offset + width / 2) / labelRadius;
			offset += width;
			return angle;
		});
	});
</script>

<PlanetFrame
	id="gigs"
	{position}
	{focused}
	{compact}
	{baseScale}
	{onselect}
	rotation={[0, -Math.PI / 16, 0]}
	from="right"
	delay={0.4}
	phase={3.7}
>
	<GigRings {focused} {onselect} />
	{#if focused}
		<HTML center>
			<button
				class="focused-label"
				type="button"
				aria-label="View gigs"
				aria-pressed="true"
				onclick={onselect}>Gigs</button
			>
		</HTML>
	{/if}
	<T.Mesh rotation.x={Math.PI / 5}>
		<T.SphereGeometry args={[radius, 96, 64]} />
		<T.MeshStandardMaterial color="#00ff00" toneMapped={false} />
		<Outlines color="black" thickness={0.01} />
		{#each letters as letter, index (index)}
			<HTML
				transform
				position={[Math.sin(angles[index]) * labelRadius, 0, Math.cos(angles[index]) * labelRadius]}
				rotation.y={angles[index]}
				distanceFactor={1}
				pointerEvents={index === 0 && !compact && !focused ? 'auto' : 'none'}
			>
				<svelte:element
					this={index === 0 ? 'button' : 'span'}
					bind:this={letterElements[index]}
					class="label-letter"
					type={index === 0 ? 'button' : undefined}
					style:visibility={compact || focused ? 'hidden' : 'visible'}
					aria-label={index === 0 ? 'View gigs' : undefined}
					aria-pressed={index === 0 ? focused : undefined}
					aria-hidden={compact || focused || index > 0 ? true : undefined}
					tabindex={index === 0 ? (compact || focused ? -1 : 0) : undefined}
					onclick={(event: MouseEvent) => {
						event.stopPropagation();
						onselect?.();
					}}>{letter}</svelte:element
				>
			</HTML>
		{/each}
	</T.Mesh>
</PlanetFrame>

<style>
	.focused-label {
		padding: 0;
		border: 0;
		background: none;
		color: white;
		font:
			100 clamp(22px, 3.5vw, 42px) / 1 system-ui,
			sans-serif;
		cursor: pointer;
	}
	.label-letter {
		display: block;
		padding: 0;
		border: 0;
		background: none;
		color: white;
		cursor: pointer;
		font:
			100 110px / 1 system-ui,
			sans-serif;
		white-space: nowrap;
		user-select: none;
	}
</style>
