<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { tick } from 'svelte';
	import { innerWidth } from 'svelte/reactivity/window';
	import Scene from '#lib/components/Scene.svelte';
	import type { PlanetId } from '#lib/data/planets.ts';

	let focused = $state<PlanetId | null>(null);
	let overviewScroll = 0;
	const mobile = $derived((innerWidth.current ?? Infinity) <= 700);

	function selectSection(section: PlanetId) {
		if (mobile && !focused) overviewScroll = window.scrollY;
		focused = section;
	}

	async function goBack() {
		focused = null;
		await tick();
		if (mobile) window.scrollTo({ top: overviewScroll, behavior: 'instant' });
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape' && focused) void goBack();
	}}
/>

<header>
	<h1>pasmophobia</h1>
	<p>dj & producer based in Tokyo</p>
</header>

<div class="scene" class:focused={focused !== null}>
	<Canvas>
		<Scene {focused} onfocus={selectSection} />
	</Canvas>
</div>

{#if focused}
	<button class="back" type="button" onclick={goBack}> ← Back </button>
{/if}

<style>
	header {
		position: relative;
		z-index: 1;
		width: fit-content;
	}

	.scene {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
	}

	.back {
		position: absolute;
		bottom: 24px;
		left: 24px;
		z-index: 1;
		padding: 0.6rem 1rem;
		border: 1px solid currentColor;
		border-radius: 999px;
		background: white;
		color: #111;
		font: inherit;
		cursor: pointer;
	}

	@media (max-width: 700px) {
		.scene {
			/* Place Releases just above the viewport midpoint while keeping the scene's scale. */
			transform: translateY(max(0px, calc(42svh - 32vw - 85px)));
			bottom: auto;
			height: max(100svh, calc(300vw + 100px));
			touch-action: pan-y pinch-zoom;
		}
		.scene.focused {
			position: fixed;
			inset: 0;
			transform: none;
			height: 100svh;
			clip-path: inset(110px 0 0);
		}
		.back {
			position: fixed;
		}
	}
</style>
