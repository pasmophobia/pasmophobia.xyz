<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { untrack, type Snippet } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Group, OrthographicCamera, PerspectiveCamera, type Vector3Tuple } from 'three';

	interface Props {
		position: Vector3Tuple;
		rotation?: Vector3Tuple;
		from: 'left' | 'right' | 'top' | 'bottom';
		delay?: number;
		phase?: number;
		floatAmount?: number;
		upright?: boolean;
		children: Snippet;
	}

	let {
		position,
		rotation = [0, 0, 0],
		from,
		delay = 0,
		phase = 0,
		floatAmount = 0.1,
		upright = false,
		children
	}: Props = $props();

	const { camera, size } = useThrelte();
	const group = new Group();
	let elapsed = 0;
	const duration = 2.8;
	const floatSpeed = 0.25;

	function updatePose() {
		if (prefersReducedMotion.current) {
			group.position.set(...position);
			group.rotation.set(upright ? 0 : rotation[0], rotation[1], upright ? 0 : rotation[2]);
			return;
		}

		const activeCamera = camera.current;
		if (
			!(activeCamera instanceof OrthographicCamera) &&
			!(activeCamera instanceof PerspectiveCamera)
		)
			return;
		// Keep the entire object and its HTML outside the canvas before entry.
		const margin = 2.5;
		const halfHeight =
			activeCamera instanceof PerspectiveCamera
				? Math.tan((activeCamera.getEffectiveFOV() * Math.PI) / 360) *
					(Math.abs(activeCamera.position.z - position[2]) + margin)
				: size.current.height / (2 * activeCamera.zoom);
		const halfWidth =
			activeCamera instanceof PerspectiveCamera
				? halfHeight * activeCamera.aspect
				: size.current.width / (2 * activeCamera.zoom);
		const startX =
			from === 'left'
				? activeCamera.position.x - halfWidth - margin
				: from === 'right'
					? activeCamera.position.x + halfWidth + margin
					: position[0] + 0.8;
		const startY =
			from === 'top'
				? activeCamera.position.y + halfHeight + margin
				: from === 'bottom'
					? activeCamera.position.y - halfHeight - margin
					: position[1] - 0.7;
		const progress = Math.min(1, Math.max(0, (elapsed - delay) / duration));
		const arrival = 1 - (1 - progress) ** 3;
		const remaining = 1 - arrival;
		const time = Math.max(0, elapsed - delay) * floatSpeed;
		const sway = Math.sin(time * 0.55 + phase);
		const bob = Math.sin(time * 0.8 + phase);

		group.position.set(
			position[0] + (startX - position[0]) * remaining + sway * 0.07 * arrival,
			position[1] + (startY - position[1]) * remaining + bob * floatAmount * arrival,
			position[2]
		);
		group.rotation.set(
			upright
				? 0
				: rotation[0] + 0.16 * remaining + Math.sin(time * 0.43 + phase) * 0.025 * arrival,
			rotation[1] + Math.cos(time * 0.37 + phase) * 0.06 * arrival,
			upright
				? 0
				: rotation[2] +
						(from === 'left' || from === 'bottom' ? -0.2 : 0.2) * remaining +
						sway * 0.035 * arrival
		);
	}

	// Set the offscreen pose before child HTML components measure their transforms.
	untrack(updatePose);
	$effect.pre(() => {
		void $camera;
		void $size;
		updatePose();
	});

	useTask(
		(delta) => {
			if (document.hidden) return;
			elapsed += Math.min(delta, 0.05);
			updatePose();
		},
		{ running: () => !prefersReducedMotion.current }
	);
</script>

<T is={group}>
	{@render children()}
</T>
