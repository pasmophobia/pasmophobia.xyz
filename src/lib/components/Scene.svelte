<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { onMount } from 'svelte';
	import { cubicInOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { getCameraView, getFocusAngles } from '../scene/camera';
	import { getSceneLayout } from '../scene/layout';
	import { planetIds, planets, type PlanetId } from '../data/planets';
	import Releases from './Releases.svelte';
	import About from './About.svelte';
	import Gigs from './Gigs.svelte';
	import Contact from './Contact.svelte';

	let {
		focused = null,
		onfocus
	}: {
		focused?: PlanetId | null;
		onfocus?: (section: PlanetId) => void;
	} = $props();

	const { size, renderer } = useThrelte();
	// HTML controls handle their own clicks; only canvas events should pick 3D objects.
	interactivity({ target: renderer.domElement });
	const layout = $derived(getSceneLayout($size.width, $size.height));
	const planetComponents = { releases: Releases, about: About, gigs: Gigs, contact: Contact };
	const focus = new Tween(
		{ x: 0, y: 0, amount: 0, azimuth: 0, elevation: 0, ringView: 0, detailRadius: 2.9 },
		{ duration: 1400, easing: cubicInOut }
	);
	const view = $derived(getCameraView($size.width, $size.height, focus.current));
	let fontsReady = $state(false);
	let ready = $state(false);

	$effect(() => {
		const position = focused ? layout.positions[focused] : [0, 0, 0];
		const angles = focused
			? getFocusAngles(focused, $size.width / Math.max(1, $size.height))
			: { azimuth: 0, elevation: 0 };
		void focus.set(
			{
				x: position[0],
				y: position[1],
				amount: focused ? 1 : 0,
				ringView: focused === 'gigs' ? 1 : 0,
				detailRadius: focused ? Math.max(...planets[focused].bounds) * 1.5 + 0.12 : 2.9,
				...angles
			},
			{ duration: prefersReducedMotion.current ? 0 : 1400 }
		);
	});

	onMount(() => {
		let mounted = true;
		void document.fonts.ready.then(() => {
			if (mounted) fontsReady = true;
		});
		return () => {
			mounted = false;
		};
	});

	$effect(() => {
		if (fontsReady && $size.width > 0 && $size.height > 0) ready = true;
	});
</script>

<!-- <T.OrthographicCamera makeDefault zoom={view.zoom} position={[0, 0, 10]} /> -->
<T.PerspectiveCamera
	makeDefault
	fov={view.fov}
	near={0.1}
	far={1000}
	position={view.position}
	quaternion={view.quaternion}
/>

<T.AmbientLight intensity={3} />

{#if ready}
	{#each planetIds as id (id)}
		{@const Planet = planetComponents[id]}
		<Planet
			position={layout.positions[id]}
			baseScale={layout.baseScale}
			focused={focused === id}
			compact={focused !== null && focused !== id}
			onselect={() => onfocus?.(id)}
		/>
	{/each}
{/if}
