import { colors } from '../../theme';
import type {
    AchievementCardData,
    ArticleSection,
    GlossaryTermData,
    LevelUpRewardData,
    QuizQuestion,
    ScienceArticle,
    StreakMetric,
} from '../types/content';

export const glossaryTerms: GlossaryTermData[] = [
    {
        id: 'term-exoplanet',
        term: 'Exoplanet',
        pronunciation: 'ek-soh-plan-it',
        definition: 'A planet that orbits a star outside our solar system.',
        plainLanguage: 'A world circling a distant sun.',
        example: 'NASA missions confirm exoplanets by watching starlight dip as a planet passes in front of its star.',
        relatedArticleIds: ['article-webb-clouds'],
    },
    {
        id: 'term-spectrum',
        term: 'Spectrum',
        definition: 'A spread of light separated by wavelength, often used to identify chemicals in faraway objects.',
        plainLanguage: 'A light fingerprint that reveals what something is made of.',
        example: 'Water vapor leaves recognizable marks in an infrared spectrum.',
        relatedArticleIds: ['article-webb-clouds'],
    },
    {
        id: 'term-carbon-sink',
        term: 'Carbon sink',
        definition: 'A natural or engineered system that absorbs more carbon dioxide than it releases.',
        plainLanguage: 'A place that stores carbon instead of adding it to the air.',
        example: 'Healthy forests and ocean plankton can act as carbon sinks.',
        relatedArticleIds: ['article-ocean-forests'],
    },
    {
        id: 'term-neuroplasticity',
        term: 'Neuroplasticity',
        definition: 'The brain\'s ability to change its connections in response to learning, practice, or injury.',
        plainLanguage: 'Your brain rewiring itself as you learn.',
        example: 'Practicing a skill repeatedly can strengthen the neural pathways that support it.',
        relatedArticleIds: ['article-sleep-memory'],
    },
];

export const articleBodySections: ArticleSection[] = [
    {
        id: 'section-webb-1',
        heading: 'A planet hiding in starlight',
        kind: 'overview',
        glossaryTermIds: ['term-exoplanet'],
        body: [
            'When a planet crosses in front of its star, a tiny fraction of light filters through the planet\'s atmosphere before reaching a telescope.',
            'The James Webb Space Telescope can split that filtered light into a spectrum, turning a faint dip in brightness into evidence about clouds, gases, and temperature.',
        ],
    },
    {
        id: 'section-webb-2',
        heading: 'What infrared light reveals',
        kind: 'body',
        glossaryTermIds: ['term-spectrum'],
        body: [
            'Different molecules absorb specific wavelengths. Scientists compare the missing wavelengths with laboratory measurements to infer what is floating in the atmosphere.',
            'Instead of seeing a crisp photo of the planet, researchers build a careful probability map from repeated observations and error checks.',
        ],
    },
    {
        id: 'section-webb-3',
        heading: 'Why clouds matter',
        kind: 'callout',
        body: [
            'Clouds can flatten or mute chemical signals. That makes them scientifically interesting, not just inconvenient: cloud height and particle size can hint at atmospheric circulation.',
        ],
    },
    {
        id: 'section-webb-4',
        heading: 'The big takeaway',
        kind: 'takeaway',
        body: [
            'The headline is not that Webb found a second Earth. It is that modern telescopes can test atmospheric ideas for worlds we cannot directly visit.',
        ],
    },
];

export const featuredArticle: ScienceArticle = {
    id: 'article-webb-clouds',
    slug: 'webb-clouds-distant-worlds',
    title: 'How Webb reads clouds on distant worlds',
    dek: 'A midnight tour through spectra, exoplanets, and the clues hidden inside filtered starlight.',
    summary:
        'Learn how astronomers use infrared fingerprints to infer the weather and chemistry of planets orbiting other stars.',
    category: 'Astronomy',
    readingLevel: 'intermediate',
    readMinutes: 6,
    publishedLabel: 'Today',
    sourceLabel: 'Scilens Editorial Mock',
    author: 'Mira Rao',
    icon: '🪐',
    accentColor: colors.primary,
    tags: ['Space weather', 'Spectra', 'JWST'],
    stats: [
        { label: 'Key idea', value: 'Light fingerprints' },
        { label: 'XP', value: '+120' },
    ],
    sections: articleBodySections,
    glossaryTermIds: ['term-exoplanet', 'term-spectrum'],
    quizQuestionIds: ['quiz-webb-1', 'quiz-webb-2'],
    isFeatured: true,
};

export const articleList: ScienceArticle[] = [
    featuredArticle,
    {
        id: 'article-ocean-forests',
        slug: 'ocean-forests-carbon-map',
        title: 'The floating forests that help store carbon',
        dek: 'Kelp, plankton, and the ocean systems that quietly reshape climate math.',
        summary: 'A clear explanation of how marine ecosystems absorb carbon and why measurement remains difficult.',
        category: 'Climate',
        readingLevel: 'foundational',
        readMinutes: 4,
        publishedLabel: 'Yesterday',
        sourceLabel: 'Scilens Editorial Mock',
        author: 'Jon Bell',
        icon: '🌊',
        accentColor: colors.secondary,
        tags: ['Climate', 'Oceans', 'Carbon'],
        stats: [
            { label: 'Focus', value: 'Carbon sinks' },
            { label: 'XP', value: '+80' },
        ],
        sections: [
            {
                id: 'section-ocean-1',
                heading: 'Blue carbon in motion',
                kind: 'overview',
                glossaryTermIds: ['term-carbon-sink'],
                body: ['Ocean life can store carbon in living tissue, shells, sediments, and deep water circulation.'],
            },
        ],
        glossaryTermIds: ['term-carbon-sink'],
        quizQuestionIds: ['quiz-ocean-1'],
    },
    {
        id: 'article-sleep-memory',
        slug: 'sleep-memory-brain-replay',
        title: 'Why your brain replays the day while you sleep',
        dek: 'Memory consolidation, neural rhythms, and the science of waking up smarter.',
        summary: 'A readable guide to how sleep supports learning by strengthening and pruning neural connections.',
        category: 'Neuroscience',
        readingLevel: 'intermediate',
        readMinutes: 5,
        publishedLabel: '2 days ago',
        sourceLabel: 'Scilens Editorial Mock',
        author: 'Leah Kim',
        icon: '🧠',
        accentColor: colors.electricIndigo,
        tags: ['Brain', 'Sleep', 'Learning'],
        stats: [
            { label: 'Focus', value: 'Memory replay' },
            { label: 'XP', value: '+95' },
        ],
        sections: [
            {
                id: 'section-sleep-1',
                heading: 'Practice echoes at night',
                kind: 'overview',
                glossaryTermIds: ['term-neuroplasticity'],
                body: ['During sleep, the brain can reactivate patterns linked to recent experiences and learning.'],
            },
        ],
        glossaryTermIds: ['term-neuroplasticity'],
        quizQuestionIds: ['quiz-sleep-1'],
    },
];

export const quizQuestions: QuizQuestion[] = [
    {
        id: 'quiz-webb-1',
        articleId: 'article-webb-clouds',
        prompt: 'What does a spectrum help astronomers identify in an exoplanet atmosphere?',
        explanation: 'A spectrum shows which wavelengths were absorbed, creating clues about molecules in the atmosphere.',
        options: [
            {
                id: 'quiz-webb-1-a',
                label: 'A',
                text: 'The exact color of the planet\'s surface rocks',
                isCorrect: false,
                feedback: 'Spectra do not usually reveal a detailed surface view for distant exoplanets.',
            },
            {
                id: 'quiz-webb-1-b',
                label: 'B',
                text: 'Chemical fingerprints from gases and clouds',
                isCorrect: true,
                feedback: 'Correct. Missing wavelengths can point to molecules and atmospheric structure.',
            },
            {
                id: 'quiz-webb-1-c',
                label: 'C',
                text: 'The name of the star system',
                isCorrect: false,
                feedback: 'Star systems are cataloged separately; spectra are about light and matter.',
            },
            {
                id: 'quiz-webb-1-d',
                label: 'D',
                text: 'Whether astronauts can land there next year',
                isCorrect: false,
                feedback: 'These planets are far beyond current crewed travel.',
            },
        ],
    },
    {
        id: 'quiz-webb-2',
        articleId: 'article-webb-clouds',
        prompt: 'Why can clouds make exoplanet observations harder to interpret?',
        explanation: 'Cloud layers can hide or soften the spectral signatures that scientists are trying to measure.',
        options: [
            {
                id: 'quiz-webb-2-a',
                label: 'A',
                text: 'They can mute the chemical signals in filtered starlight',
                isCorrect: true,
                feedback: 'Correct. Clouds can flatten spectral features and complicate the model.',
            },
            {
                id: 'quiz-webb-2-b',
                label: 'B',
                text: 'They make telescopes stop collecting infrared light',
                isCorrect: false,
                feedback: 'The telescope still collects light; the atmospheric signal becomes harder to decode.',
            },
            {
                id: 'quiz-webb-2-c',
                label: 'C',
                text: 'They erase the planet\'s orbit',
                isCorrect: false,
                feedback: 'The orbit remains measurable through repeated transits.',
            },
            {
                id: 'quiz-webb-2-d',
                label: 'D',
                text: 'They turn every planet into a star',
                isCorrect: false,
                feedback: 'Clouds change atmospheric readings, not the object\'s basic identity.',
            },
        ],
    },
];

export const streakMetrics: StreakMetric[] = [
    {
        id: 'streak-current',
        label: 'Current streak',
        value: '12',
        unit: 'days',
        delta: '+3 this week',
        description: 'Keep reading one science card per day to maintain the chain.',
        progress: 0.72,
        icon: '🔥',
        accentColor: colors.primary,
    },
    {
        id: 'streak-comprehension',
        label: 'Quiz accuracy',
        value: '86',
        unit: '%',
        delta: '+6%',
        description: 'Average score across the last seven comprehension checks.',
        progress: 0.86,
        icon: '🎯',
        accentColor: colors.secondary,
    },
    {
        id: 'streak-reading',
        label: 'Minutes read',
        value: '48',
        unit: 'min',
        delta: 'weekly',
        description: 'Short sessions add up to durable science literacy.',
        progress: 0.6,
        icon: '⏱️',
        accentColor: colors.electricIndigo,
    },
];

export const achievementCards: AchievementCardData[] = [
    {
        id: 'achievement-spectrum-sleuth',
        title: 'Spectrum Sleuth',
        description: 'Answer three light-and-matter questions correctly.',
        icon: '🔬',
        tier: 'silver',
        progress: 3,
        goal: 3,
        isUnlocked: true,
        accentColor: colors.primary,
    },
    {
        id: 'achievement-cosmos-week',
        title: 'Cosmos Week',
        description: 'Read five astronomy explainers in one week.',
        icon: '✨',
        tier: 'gold',
        progress: 4,
        goal: 5,
        isUnlocked: false,
        accentColor: colors.secondary,
    },
    {
        id: 'achievement-deep-reader',
        title: 'Deep Reader',
        description: 'Finish an advanced article and its quiz without skipping.',
        icon: '📚',
        tier: 'bronze',
        progress: 1,
        goal: 2,
        isUnlocked: false,
        accentColor: colors.electricIndigo,
    },
];

export const levelUpRewardData: LevelUpRewardData = {
    id: 'level-up-7',
    levelNumber: 7,
    levelTitle: 'Orbital Analyst',
    previousLevel: 'Curious Observer',
    nextLevel: 'Evidence Cartographer',
    xpAwarded: 320,
    unlockedRewards: ['Midnight nebula badge frame', 'Advanced astronomy reading lane', '2x streak shield'],
    message: 'You are getting faster at turning scientific evidence into plain-language explanations.',
    primaryActionLabel: 'Continue exploring',
};