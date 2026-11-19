import type { Vector3Tuple } from 'three';

export const planetIds = ['releases', 'about', 'gigs', 'contact'] as const;
export type PlanetId = (typeof planetIds)[number];

export interface PlanetProps {
	position: Vector3Tuple;
	focused?: boolean;
	compact?: boolean;
	baseScale?: number;
	onselect?: () => void;
}

export const planets: Record<
	PlanetId,
	{
		title: string;
		position: Vector3Tuple;
		bounds: Vector3Tuple;
		captionPosition: Vector3Tuple;
	}
> = {
	releases: {
		title: 'Releases',
		position: [-3, 0.7, 0],
		bounds: [1.9, 1.25, 1.9],
		captionPosition: [0, -0.95, 0]
	},
	about: {
		title: 'About',
		position: [-0.2, -2.5, 0],
		bounds: [1.05, 0.85, 1.05],
		captionPosition: [0, -0.65, 0]
	},
	gigs: {
		title: 'Gigs',
		position: [2.5, 0.2, 0],
		bounds: [1.85, 1.85, 1.85],
		captionPosition: [0, -1, 0]
	},
	contact: {
		title: 'Contact',
		position: [0.4, 2, 0],
		bounds: [0.5, 0.8, 0.5],
		captionPosition: [0, 0.8, 0]
	}
};
