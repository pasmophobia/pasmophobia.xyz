<script lang="ts">
	import { T } from '@threlte/core';
	import { HTML, useCursor, type IntersectionEvent } from '@threlte/extras';
	import type { Snippet } from 'svelte';
	import { Spring } from 'svelte/motion';
	import type { Vector3Tuple } from 'three';
	import { planets, type PlanetId, type PlanetProps } from '../data/planets';
	import FloatingObject from './FloatingObject.svelte';

	let {
		id,
		position,
		focused = false,
		compact = false,
		baseScale = 1,
		showShortcut = true,
		onselect,
		rotation = [0, 0, 0],
		from,
		delay,
		phase,
		floatAmount,
		upright = false,
		children
	}: PlanetProps & {
		id: PlanetId;
		showShortcut?: boolean;
		rotation?: Vector3Tuple;
		from: 'left' | 'right' | 'top' | 'bottom';
		delay?: number;
		phase?: number;
		floatAmount?: number;
		upright?: boolean;
		children: Snippet;
	} = $props();

	const scale = new Spring(1);
	const { hovering, onPointerEnter, onPointerLeave } = useCursor();
	$effect(() => {
		scale.target = focused || $hovering ? 1.5 : baseScale;
	});
	$effect(() => {
		if (compact) onPointerLeave();
	});
</script>

<FloatingObject {position} {rotation} {from} {delay} {phase} {floatAmount} {upright}>
	<T.Group
		name={`planet:${id}`}
		scale={scale.current}
		onclick={(event: IntersectionEvent<MouseEvent>) => {
			event.stopPropagation();
			onselect?.();
		}}
		onpointerenter={onPointerEnter}
		onpointerleave={onPointerLeave}
	>
		{@render children()}
		{#if compact && showShortcut}
			<HTML center position={planets[id].captionPosition} zIndexRange={[16777273, 16777273]}>
				<button
					type="button"
					class="shortcut"
					aria-label={`View ${id}`}
					onclick={(event) => {
						event.stopPropagation();
						onPointerLeave();
						onselect?.();
					}}>{planets[id].title}</button
				>
			</HTML>
		{/if}
	</T.Group>
</FloatingObject>

<style>
	.shortcut {
		min-width: 60px;
		min-height: 36px;
		padding: 4px 8px;
		border: 0;
		border-radius: 4px;
		background: none;
		color: #111;
		font:
			400 13px / 1.2 system-ui,
			sans-serif;
		white-space: nowrap;
		cursor: pointer;
	}

	.shortcut:focus-visible {
		outline: 1px solid currentColor;
		outline-offset: 2px;
	}
</style>
