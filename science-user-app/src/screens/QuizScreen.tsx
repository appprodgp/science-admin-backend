import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { QuizOptionCard } from '../components/article/QuizOptionCard';
import { AppScreen } from '../components/layout/AppScreen';
import { FloatingHeader } from '../components/layout/FloatingHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { Pill } from '../components/ui/Pill';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { articleList, featuredArticle, quizQuestions } from '../data/mockContent';
import type { QuizOption } from '../types/content';

type RouteParams = {
    id?: string | string[];
};

function getParamValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function resolveArticle(articleId?: string) {
    return articleList.find((article) => article.id === articleId || article.slug === articleId) ?? featuredArticle;
}

export function QuizScreen() {
    const params = useLocalSearchParams<RouteParams>();
    const articleId = getParamValue(params.id);
    const article = useMemo(() => resolveArticle(articleId), [articleId]);
    const articleQuestions = useMemo(() => quizQuestions.filter((question) => question.articleId === article.id), [article.id]);
    const fallbackQuestions = useMemo(
        () => quizQuestions.filter((question) => question.articleId === featuredArticle.id),
        [],
    );
    const questions = articleQuestions.length > 0 ? articleQuestions : fallbackQuestions;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);

    const safeQuestionIndex = Math.min(currentQuestionIndex, Math.max(questions.length - 1, 0));
    const question = questions[safeQuestionIndex];
    const selectedOption = question?.options.find((option) => option.id === selectedOptionId);
    const isLastQuestion = safeQuestionIndex === questions.length - 1;
    const progress = questions.length > 0 ? (safeQuestionIndex + (revealed ? 1 : 0.35)) / questions.length : 0;
    const usesFallbackQuestions = articleQuestions.length === 0;

    function handleOptionPress(option: QuizOption) {
        if (!revealed) {
            setSelectedOptionId(option.id);
        }
    }

    function handlePrimaryAction() {
        if (!question || !selectedOptionId) {
            return;
        }

        if (!revealed) {
            setRevealed(true);
            return;
        }

        if (isLastQuestion) {
            router.replace('/level-up');
            return;
        }

        setCurrentQuestionIndex((index) => index + 1);
        setSelectedOptionId(null);
        setRevealed(false);
    }

    const primaryTitle = revealed ? (isLastQuestion ? 'Complete and level up' : 'Next question') : 'Check answer';

    return (
        <AppScreen backgroundVariant="aurora" contentContainerStyle={styles.screenContent}>
            <FloatingHeader
                eyebrow="Comprehension quiz"
                title="Test the signal, not your memory."
                subtitle={article.title}
                rightAccessory={<Pill label={`${safeQuestionIndex + 1}/${questions.length}`} tone="primary" icon="🎯" size="sm" />}
            />

            <GlassCard variant="elevated" style={styles.quizCard}>
                <View style={styles.quizTopRow}>
                    <View style={styles.quizIconBubble}>
                        <Text style={styles.quizIcon}>{article.icon}</Text>
                    </View>
                    <View style={styles.quizMetaCopy}>
                        <Text style={styles.quizEyebrow}>{usesFallbackQuestions ? 'Sample fallback quiz' : 'Article quiz'}</Text>
                        <Text style={styles.quizMetaTitle}>{article.category} comprehension</Text>
                    </View>
                    <Pill label="Mock data" tone="neutral" size="sm" />
                </View>
                <ProgressBar progress={progress} label="Quiz progress" showPercent fillColor={article.accentColor} />
            </GlassCard>

            {question ? (
                <GlassCard variant="elevated" style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                        <Pill label={`Question ${safeQuestionIndex + 1}`} tone="secondary" size="sm" />
                        {selectedOption ? (
                            <Pill
                                label={revealed ? (selectedOption.isCorrect ? 'Correct' : 'Review') : `Selected ${selectedOption.label}`}
                                tone={revealed ? (selectedOption.isCorrect ? 'primary' : 'danger') : 'secondary'}
                                size="sm"
                            />
                        ) : null}
                    </View>
                    <Text style={styles.prompt}>{question.prompt}</Text>

                    <View style={styles.optionList}>
                        {question.options.map((option) => (
                            <QuizOptionCard
                                key={option.id}
                                option={option}
                                selected={selectedOptionId === option.id}
                                revealed={revealed}
                                disabled={revealed}
                                onPress={handleOptionPress}
                            />
                        ))}
                    </View>

                    {revealed ? (
                        <GlassCard variant="subtle" style={styles.explanationCard}>
                            <Text style={styles.explanationTitle}>Why this matters</Text>
                            <Text style={styles.explanationText}>{question.explanation}</Text>
                        </GlassCard>
                    ) : null}

                    <PrimaryButton title={primaryTitle} onPress={handlePrimaryAction} disabled={!selectedOptionId} />
                    <PrimaryButton
                        title="Back to article"
                        variant="ghost"
                        onPress={() => router.push({ pathname: '/article/[id]', params: { id: article.id } })}
                    />
                </GlassCard>
            ) : (
                <GlassCard variant="elevated" style={styles.questionCard}>
                    <Text style={styles.prompt}>No mock quiz questions are available yet.</Text>
                    <PrimaryButton title="Return to Discover" onPress={() => router.replace('/discover')} />
                </GlassCard>
            )}

            <GlassCard variant="subtle" style={styles.staticNoteCard}>
                <Text style={styles.staticNoteTitle}>Static interaction only</Text>
                <Text style={styles.staticNoteText}>
                    Option selection, answer reveal, and completion flow are handled with React state. No scores are saved and no APIs are called.
                </Text>
            </GlassCard>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        paddingBottom: 112,
    },
    quizCard: {
        gap: spacing.md,
    },
    quizTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    quizIconBubble: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 1,
        borderColor: 'rgba(78,222,163,0.38)',
        backgroundColor: 'rgba(78,222,163,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quizIcon: {
        fontSize: 26,
    },
    quizMetaCopy: {
        flex: 1,
        gap: spacing.xs,
    },
    quizEyebrow: {
        ...typography.sizes.labelSm,
        color: colors.primary,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    quizMetaTitle: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '800',
    },
    questionCard: {
        gap: spacing.lg,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    prompt: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    optionList: {
        gap: spacing.md,
    },
    explanationCard: {
        gap: spacing.xs,
        borderColor: 'rgba(78,222,163,0.36)',
        backgroundColor: 'rgba(78,222,163,0.08)',
    },
    explanationTitle: {
        ...typography.sizes.labelMd,
        color: colors.primary,
        fontWeight: '800',
    },
    explanationText: {
        ...typography.sizes.bodyMd,
        color: colors.onSurface,
    },
    staticNoteCard: {
        gap: spacing.xs,
        borderRadius: radii.lg,
    },
    staticNoteTitle: {
        ...typography.sizes.labelMd,
        color: colors.secondary,
        fontWeight: '800',
    },
    staticNoteText: {
        ...typography.sizes.labelMd,
        color: colors.onSurfaceVariant,
    },
});

export default QuizScreen;