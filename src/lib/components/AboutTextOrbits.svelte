<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { CanvasTexture, SRGBColorSpace } from 'three';

	const biographies = [
		{
			language: 'ja',
			text: '日本とノルウェーにルーツを持ち、東京を拠点に活動するDJ。ミニマルを軸に、ハウスとテクノを横断する。深みのあるグルーヴと緻密なミキシングで空間を構築する。',
			radius: 0.7,
			height: 0.4,
			duration: 80
		},
		{
			language: 'en',
			text: 'A Tokyo-based DJ with Japanese and Norwegian roots. With a focus on minimal sounds, they move between house and techno, shaping spaces through deep grooves and precise mixing.',
			radius: 0.7,
			height: 0.3,
			duration: 92
		}
	];
	const textureWidth = 4096;
	const textureHeight = 256;
	let textures = $state<CanvasTexture[]>([]);
	let elapsed = $state(0);

	onMount(() => {
		// Wrap each full sentence onto a transparent cylinder so the text has real depth.
		const maps = biographies.map(({ text }) => {
			const canvas = document.createElement('canvas');
			canvas.width = textureWidth;
			canvas.height = textureHeight;
			const context = canvas.getContext('2d')!;
			const font = 'system-ui, sans-serif';
			context.font = `100px ${font}`;
			const fontSize = Math.min(
				100,
				((textureWidth - 160) / context.measureText(text).width) * 100
			);
			context.font = `${fontSize}px ${font}`;
			context.fillStyle = '#111111';
			context.textBaseline = 'middle';
			context.fillText(text, 80, textureHeight / 2);
			const texture = new CanvasTexture(canvas);
			texture.colorSpace = SRGBColorSpace;
			texture.anisotropy = 8;
			return texture;
		});
		textures = maps;
		return () => maps.forEach((texture) => texture.dispose());
	});

	useTask(
		(delta) => {
			if (!document.hidden) elapsed += Math.min(delta, 0.05);
		},
		{ running: () => !prefersReducedMotion.current }
	);
</script>

<div class="accessible-biography">
	{#each biographies as biography (biography.language)}
		<p lang={biography.language}>{biography.text}</p>
	{/each}
</div>

{#if textures.length}
	{#each biographies as biography, index (biography.language)}
		<T.Mesh
			name={`about-text:${biography.language}`}
			position.y={biography.height}
			rotation.y={-Math.PI / 2 - (elapsed / biography.duration) * Math.PI * 2}
		>
			<T.CylinderGeometry
				args={[
					biography.radius,
					biography.radius,
					(biography.radius * Math.PI * 2 * textureHeight) / textureWidth,
					128,
					1,
					true
				]}
			/>
			<T.MeshBasicMaterial
				map={textures[index]}
				transparent
				depthWrite={false}
				toneMapped={false}
			/>
		</T.Mesh>
	{/each}
{/if}

<style>
	.accessible-biography {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
