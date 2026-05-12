export interface Friend {
	name: string;
	avatar: string;
	description: string;
	url: string;
	status?: string;
}

export const friends: Friend[] = [
	{
		name: "XingHuiSamaの宝藏之地",
		avatar: "https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg",
		description: "今天我也要学习吗",
		url: "https://www.xinghuisama.top",
		status: "online",
	},
];

export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

export function getFriendsList(): FriendItem[] {
	return friends.map((friend, index) => ({
		id: index + 1,
		title: friend.name,
		imgurl: friend.avatar,
		desc: friend.description,
		siteurl: friend.url,
		tags: [friend.status ?? "friend"],
	}));
}

export function getShuffledFriendsList(): FriendItem[] {
	const shuffled = [...getFriendsList()];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
