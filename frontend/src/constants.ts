import { Manga } from './types';

// Helper to generate pages
const generatePages = (count: number, seed: string) => 
  Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/800/1200`);

export const MOCK_MANGA: Manga[] = [
  {
    id: '1',
    title: 'Soul Resonator',
    altTitle: 'Tamashii no Kyōmei',
    author: 'Kaito Ishida',
    status: 'Ongoing',
    genres: ['Action', 'Supernatural', 'Shonen'],
    description: 'In a world where music dictates the flow of magic, a deaf boy discovers he can resonate with the "Silent Frequency," a power capable of shattering the corrupted symphonies of the ruling Sound Lords.',
    coverUrl: 'https://picsum.photos/seed/soulres/300/450',
    rating: 4.8,
    chapters: Array.from({ length: 15 }, (_, i) => ({
      id: `c${15 - i}`,
      number: 15 - i,
      title: `Movement ${15 - i}: The Silent Beat`,
      date: '2024-03-10',
      pages: generatePages(12, `soulres-${15-i}`)
    }))
  },
  {
    id: '2',
    title: 'Cyber Ronin 2099',
    altTitle: 'Neon Samurai',
    author: 'Elena Vance',
    status: 'Ongoing',
    genres: ['Sci-Fi', 'Cyberpunk', 'Seinen'],
    description: 'After his consciousness is uploaded into a discarded combat chassis, a former Yakuza enforcer must protect the last organic garden in a sprawling, chrome-plated metropolis.',
    coverUrl: 'https://picsum.photos/seed/cyber/300/450',
    rating: 4.6,
    chapters: Array.from({ length: 8 }, (_, i) => ({
      id: `c${8 - i}`,
      number: 8 - i,
      title: `Protocol ${8 - i}: Awakening`,
      date: '2024-02-28',
      pages: generatePages(10, `cyber-${8-i}`)
    }))
  },
  {
    id: '3',
    title: 'The Alchemist\'s Debt',
    altTitle: 'Renkinjutsu no Sai',
    author: 'Hiroki Tanaka',
    status: 'Completed',
    genres: ['Fantasy', 'Adventure', 'Comedy'],
    description: 'A talented alchemist accidentally turns the King\'s castle into cheese. Now he must travel the lands to find the "Philosopher\'s Grater" to reverse the spell before the royal mice take over.',
    coverUrl: 'https://picsum.photos/seed/alchemy/300/450',
    rating: 4.9,
    chapters: Array.from({ length: 45 }, (_, i) => ({
      id: `c${45 - i}`,
      number: 45 - i,
      title: `Recipe ${45 - i}: Gouda Luck`,
      date: '2023-11-15',
      pages: generatePages(14, `alchemy-${45-i}`)
    }))
  },
  {
    id: '4',
    title: 'Void Walker',
    altTitle: 'Kokū no Tabibito',
    author: 'Sarah Chen',
    status: 'Hiatus',
    genres: ['Mystery', 'Horror', 'Psychological'],
    description: 'Every time she sleeps, she wakes up in a different parallel universe where one minor historical event changed. She is looking for the timeline where her sister is still alive.',
    coverUrl: 'https://picsum.photos/seed/void/300/450',
    rating: 4.7,
    chapters: Array.from({ length: 20 }, (_, i) => ({
      id: `c${20 - i}`,
      number: 20 - i,
      title: `Shift ${20 - i}: The Butterfly Effect`,
      date: '2024-01-05',
      pages: generatePages(18, `void-${20-i}`)
    }))
  },
  {
    id: '5',
    title: 'Academy of Gods',
    altTitle: 'Kami no Gakuen',
    author: 'Ryuu Yamamoto',
    status: 'Ongoing',
    genres: ['School Life', 'Fantasy', 'Romance'],
    description: 'Zeus sends his rebellious teenage son to a Japanese high school to learn humility. Unfortunately, the class president is the reincarnation of a Titan.',
    coverUrl: 'https://picsum.photos/seed/gods/300/450',
    rating: 4.5,
    chapters: Array.from({ length: 50 }, (_, i) => ({
      id: `c${50 - i}`,
      number: 50 - i,
      title: `Lesson ${50 - i}: Mortal Economics`,
      date: '2024-03-15',
      pages: generatePages(16, `gods-${50-i}`)
    }))
  },
    {
    id: '6',
    title: 'Iron Chef: Wasteland',
    altTitle: 'Kouya no Ryourinin',
    author: 'Marcus Flint',
    status: 'Ongoing',
    genres: ['Cooking', 'Post-Apocalyptic', 'Action'],
    description: 'In a nuclear wasteland, fresh ingredients are worth more than gold. One chef wields a wok and a shotgun to serve the best ramen in the radioactive zones.',
    coverUrl: 'https://picsum.photos/seed/chef/300/450',
    rating: 4.8,
    chapters: Array.from({ length: 5 }, (_, i) => ({
      id: `c${5 - i}`,
      number: 5 - i,
      title: `Dish ${5 - i}: Mutant Boar Stew`,
      date: '2024-03-12',
      pages: generatePages(20, `chef-${5-i}`)
    }))
  }
];
