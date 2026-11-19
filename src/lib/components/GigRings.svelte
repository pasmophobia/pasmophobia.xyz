<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { HTML, type IntersectionEvent } from '@threlte/extras';
	import { onMount } from 'svelte';
	import { cubicInOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import {
		CanvasTexture,
		DoubleSide,
		Euler,
		Group,
		Quaternion,
		SRGBColorSpace,
		type BufferGeometry
	} from 'three';
	import { gigs, gigLabel, isUpcomingGig, type Gig } from '../data/gigs';
	import { createGigRingGeometry } from '../scene/gig-ring-geometry';

	let {
		focused = false,
		onselect
	}: {
		focused?: boolean;
		onselect?: () => void;
	} = $props();

	const { camera, renderer, size } = useThrelte();
	const pixelsPerUnit = 400;
	const outerRadius = 1.82;
	const diameter = outerRadius * pixelsPerUnit * 2;
	const view = new Tween(0, { duration: 1400, easing: cubicInOut });
	const group = new Group();
	const spin = new Group();
	const orbitDuration = 120;
	const inclined = new Quaternion().setFromEuler(new Euler(-Math.PI * 0.36, 0, -0.12));
	const parentRotation = new Quaternion();
	const overhead = new Quaternion();
	let atlas = $state.raw<{ context: CanvasRenderingContext2D; texture: CanvasTexture } | null>(
		null
	);
	let ringMeshes = $state.raw<{ gig: Gig; geometry: BufferGeometry }[]>([]);
	let hovered = $state<string | null>(null);
	let now = $state(Date.now());
	let selected = $state<Gig | null>(null);
	const activeGig = $derived(selected ?? gigs[0]);
	const activeIndex = $derived(gigs.findIndex((gig) => gig.id === activeGig.id));
	let measuredWidths = $state<Record<string, number>>({});

	// Stable randomness keeps the arrangement from jumping when selection or dates change.
	function scatter(seed: string) {
		let hash = 2166136261;
		for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
		hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
		hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
		hash ^= hash >>> 16;
		return (hash >>> 0) / 4294967296;
	}

	const arcs = $derived.by(() => {
		const fontSize = $size.width <= 700 ? 48 : 32;
		const fontScale = fontSize / 32;
		const tracking = -0.8 * fontScale;
		const remaining = gigs
			.map((gig) => {
				const glyphs = Array.from(gigLabel(gig));
				const widths = glyphs.map(
					(glyph) =>
						(measuredWidths[glyph] ?? (glyph.charCodeAt(0) > 255 ? 32 : 19.2)) * fontScale +
						tracking
				);
				return {
					gig,
					glyphs,
					widths,
					width: widths.reduce((sum, width) => sum + width, 0),
					gap: 18 + scatter(`${gig.id}:gap`) * 12
				};
			})
			.sort((a, b) => scatter(a.gig.id) - scatter(b.gig.id));
		const packed = [];
		let radius = 1.72 * pixelsPerUnit;
		let ring = 0;

		while (remaining.length) {
			const start = scatter(`ring:${ring}`) * Math.PI * 2;
			const circumference = Math.PI * 2 * radius;
			let used = 0;
			while (remaining.length) {
				// Fill leftover space with any remaining label that fits, without a fixed event count.
				const index = remaining.findIndex(
					(entry) => entry.width + entry.gap <= circumference - used
				);
				if (index < 0 && used > 0) break;
				const entry = remaining.splice(Math.max(0, index), 1)[0];
				// An unusually long event gets a whole ring and shrinks just enough to fit.
				const scale = Math.min(1, (circumference - entry.gap) / entry.width);
				const width = entry.width * scale;
				const arcStart = start + used / radius;
				const sweep = width / radius;
				const reverse = Math.sin(arcStart + sweep / 2) > 0;
				let offset = 0;
				const letters = entry.glyphs.map((glyph, letterIndex) => {
					const distance = offset + (entry.widths[letterIndex] * scale) / 2;
					offset += entry.widths[letterIndex] * scale;
					const angle = arcStart + (reverse ? width - distance : distance) / radius;
					return {
						glyph,
						width: (entry.widths[letterIndex] - tracking) * scale,
						x: diameter / 2 + Math.cos(angle) * radius,
						y: diameter / 2 + Math.sin(angle) * radius,
						rotation: angle + (reverse ? -Math.PI / 2 : Math.PI / 2)
					};
				});
				packed.push({ gig: entry.gig, fontSize: fontSize * scale, letters });
				used += width + entry.gap;
			}
			radius -= fontSize * (1.22 + scatter(`spacing:${ring}`) * 0.12);
			ring += 1;
		}
		return packed;
	});

	$effect(() => {
		void view.set(focused ? 1 : 0, { duration: prefersReducedMotion.current ? 0 : 1400 });
	});

	useTask((delta) => {
		if (!group.parent || document.hidden) return;
		// Follow the current camera during its flight, ending exactly above the ring plane.
		group.parent.getWorldQuaternion(parentRotation);
		camera.current.getWorldQuaternion(overhead);
		overhead.premultiply(parentRotation.invert());
		group.quaternion.copy(inclined).slerp(overhead, view.current);
		if (!prefersReducedMotion.current) {
			spin.rotation.z =
				(spin.rotation.z - (Math.min(delta, 0.05) * Math.PI * 2) / orbitDuration) % (Math.PI * 2);
		}
	});

	$effect(() => {
		const meshes = arcs.map((arc) => ({
			gig: arc.gig,
			geometry: createGigRingGeometry(arc.letters, arc.fontSize, diameter, pixelsPerUnit)
		}));
		ringMeshes = meshes;
		return () => meshes.forEach(({ geometry }) => geometry.dispose());
	});

	$effect(() => {
		if (!atlas) return;
		const { context, texture } = atlas;
		const resolution = context.canvas.width / diameter;
		context.setTransform(resolution, 0, 0, resolution, 0, 0);
		context.clearRect(0, 0, diameter, diameter);
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		for (const arc of arcs) {
			context.font = `${arc.fontSize}px "Courier New", monospace`;
			context.fillStyle = isUpcomingGig(arc.gig, now) ? '#e22626' : '#171717';
			for (const letter of arc.letters) {
				if (!letter.glyph.trim()) continue;
				context.save();
				context.translate(letter.x, letter.y);
				context.rotate(letter.rotation);
				context.fillText(letter.glyph, 0, 0);
				if (hovered === arc.gig.id || (focused && selected?.id === arc.gig.id)) {
					context.fillRect(-letter.width / 2, arc.fontSize * 0.56, letter.width, 1);
				}
				context.restore();
			}
		}
		texture.needsUpdate = true;
	});

	onMount(() => {
		let mounted = true;
		let texture: CanvasTexture | undefined;
		void document.fonts.ready.then(() => {
			if (!mounted) return;
			const canvas = document.createElement('canvas');
			canvas.width = canvas.height = 2048;
			const context = canvas.getContext('2d')!;
			context.font = '32px "Courier New", monospace';
			const characters = [...new Set(gigs.flatMap((gig) => Array.from(gigLabel(gig))))];
			measuredWidths = Object.fromEntries(
				characters.map((character) => [character, context.measureText(character).width])
			);
			texture = new CanvasTexture(canvas);
			texture.colorSpace = SRGBColorSpace;
			texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
			atlas = { context, texture };
		});
		const updateNow = () => {
			now = Date.now();
		};
		const timer = window.setInterval(updateNow, 30_000);
		document.addEventListener('visibilitychange', updateNow);
		return () => {
			mounted = false;
			texture?.dispose();
			window.clearInterval(timer);
			document.removeEventListener('visibilitychange', updateNow);
		};
	});
</script>

<T is={group}>
	<T is={spin} name="gig-ring-spin">
		{#if atlas}
			{#each ringMeshes as ring (ring.gig.id)}
				<T.Mesh
					name={`gig-ring:${ring.gig.id}`}
					geometry={ring.geometry}
					onpointerenter={() => (hovered = ring.gig.id)}
					onpointerleave={() => (hovered = null)}
					onclick={(event: IntersectionEvent<MouseEvent>) => {
						event.stopPropagation();
						selected = ring.gig;
						onselect?.();
					}}
				>
					<T.MeshBasicMaterial
						map={atlas.texture}
						transparent
						alphaTest={0.02}
						depthTest
						depthWrite
						side={DoubleSide}
						toneMapped={false}
					/>
				</T.Mesh>
			{/each}
		{/if}
	</T>
</T>

{#if focused}
	<HTML
		fullscreen
		calculatePosition={(_object, _camera, size) => [size.width / 2, size.height / 2]}
		zIndexRange={[16777272, 16777272]}
		style="pointer-events: none"
	>
		<div class="reading-panel" aria-live="polite">
			<button
				class="previous"
				type="button"
				aria-label="Previous gig"
				onclick={(event) => {
					event.stopPropagation();
					selected = gigs[(activeIndex + gigs.length - 1) % gigs.length];
				}}>←</button
			>
			<p class:upcoming={isUpcomingGig(activeGig, now)}><strong>{activeGig.title}</strong></p>
			<p>{activeGig.venue}, {activeGig.area}</p>
			<p>
				<time datetime={activeGig.date}>{activeGig.date}</time>{#if activeGig.start}
					· {activeGig.start}–{activeGig.end}{/if} <span class="timezone">JST</span>
			</p>
			<p class="legend">
				{activeIndex + 1} / {gigs.length} · <span></span> Upcoming <span class="past"></span> Past
			</p>
			<button
				class="next"
				type="button"
				aria-label="Next gig"
				onclick={(event) => {
					event.stopPropagation();
					selected = gigs[(activeIndex + 1) % gigs.length];
				}}>→</button
			>
		</div>
	</HTML>
{/if}

<style>
	.upcoming {
		color: #e22626;
	}
	.reading-panel {
		position: absolute;
		bottom: 76px;
		left: 50%;
		box-sizing: border-box;
		width: min(500px, calc(100% - 24px));
		padding: 8px 44px;
		background: rgb(255 255 255 / 94%);
		transform: translateX(-50%);
		text-align: center;
		color: #171717;
		font:
			13px / 1.5 system-ui,
			sans-serif;
	}
	.reading-panel button {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 44px;
		height: 44px;
		border: 0;
		background: none;
		color: #171717;
		font-size: 22px;
		cursor: pointer;
		pointer-events: auto;
	}
	.previous {
		left: 0;
	}
	.next {
		right: 0;
	}
	.reading-panel p {
		margin: 2px 0;
	}
	.reading-panel strong {
		font-weight: 500;
	}
	.timezone {
		font-size: 10px;
	}
	.legend {
		font-size: 11px;
	}
	.legend span {
		display: inline-block;
		width: 6px;
		height: 6px;
		margin: 0 4px 1px 8px;
		border-radius: 50%;
		background: #e22626;
	}
	.legend .past {
		background: #171717;
	}
	@media (max-height: 600px) {
		.reading-panel {
			bottom: 12px;
			font-size: 11px;
		}
	}
	@media (max-width: 700px) {
		.reading-panel {
			font-size: 16px;
			bottom: 78px;
		}
		.legend {
			font-size: 12px;
		}
	}
</style>
