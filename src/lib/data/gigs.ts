export interface Gig {
	id: string;
	title: string;
	venue: string;
	area: string;
	date: string;
	start?: string;
	end?: string;
}

export const gigs: Gig[] = [
  {
    id: 'sideeffekt-1',
    title: 'sideeffekt',
    venue: 'R Lounge 6F',
    area: 'Shibuya',
    date: '2027-01-20',
    start: '21:00',
    end: '22:00'
  },
	{
		id: 'ishin-2026',
		title: 'ISHIN',
		venue: 'Débris',
		area: 'Daikanyama',
		date: '2026-11-30',
		start: '19:40',
		end: '20:25'
	},
	{
		id: 'four-on-the-beat-2026',
		title: 'Four on the beat',
		venue: 'White Space Lab',
		area: 'Shibuya',
		date: '2026-11-26',
		start: '20:00',
		end: '21:00'
	},
	{
		id: 'impulse-12',
		title: 'Impulse 12',
		venue: '音楽喫茶 茶箱',
		area: 'Waseda',
		date: '2026-10-30',
		start: '20:50',
		end: '21:40'
	},
	{
		id: 'dissolve-october-2026',
		title: 'Dissolve',
		venue: 'White Space Lab',
		area: 'Shibuya',
		date: '2026-10-23',
		start: '19:00',
		end: '21:00'
	},
	{
		id: 'bridge-2026',
		title: 'BRIDGE supported by CLUB PORT',
		venue: 'Z MARUYAMA',
		area: 'Shibuya',
		date: '2026-08-01',
		start: '17:00',
		end: '18:00'
	},
	{
		id: 'dissolve-june-2026',
		title: 'Dissolve',
		venue: 'White Space Lab',
		area: 'Shibuya',
		date: '2026-06-26',
		start: '19:00',
		end: '20:00'
	},
	{
		id: 'signal-2026',
		title: 'SIGNAL: 2026',
		venue: 'White Space Lab',
		area: 'Shibuya',
		date: '2026-05-12'
	},
	{
		id: 'impulse-sp-2026',
		title: 'Impulse SP',
		venue: '音楽喫茶 茶箱',
		area: 'Waseda',
		date: '2026-01-15',
		start: '19:00',
		end: '19:30'
	},
	{
		id: 'assemble-nova-4',
		title: 'Assemble Nova vol.4',
		venue: 'Altoto',
		area: 'Shimokitazawa',
		date: '2025-12-04'
	},
	{
		id: 'impulse-11',
		title: 'Impulse 11',
		venue: '音楽喫茶 茶箱',
		area: 'Waseda',
		date: '2025-10-03',
		start: '19:00',
		end: '19:30'
	}
];

export function isUpcomingGig(gig: Gig, now: number): boolean {
	// Date-only gigs remain upcoming throughout their local calendar day.
	return new Date(`${gig.date}T${gig.start ?? '23:59:59.999'}+09:00`).getTime() > now;
}

export function gigLabel(gig: Gig): string {
	const time = gig.start ? ` · ${gig.start}${gig.end ? `–${gig.end}` : ''}` : '';
	return `${gig.date} · ${gig.title} · ${gig.venue}, ${gig.area}${time}`;
}
