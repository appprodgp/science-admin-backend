import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { QuizOptionCard } from '../components/article/QuizOptionCard';
import { AppScreen } from '../components/layout/AppScreen';
import { FloatingHeader } from '../components/layout/FloatingHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { Pill } from '../components/ui/Pill';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { getPublicArticleQuiz } from '../lib/publicApi';
import type { PublicArticleQuiz, PublicQuizOption, PublicQuizQuestion } from '../types/api';
import type { QuizOption } from '../types/content';

type RouteParams = {
    id?: string | string[];
};

type QuizStateCardProps = {
    title: string;
    message: string;
    isLoading?: boolean;
    tone?: 'neutral' | 'error';
};

function getParamValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function QuizStateCard({ title, message, isLoading = false, tone = 'neutral' }: QuizStateCardProps) {
    const isError = tone === 'error';

    return (
        <GlassCard variant="subtle" style={[styles.quizStateCard, isError ? styles.quizErrorCard : null]}>
            {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
            <Text style={[styles.quizStateTitle, isError ? styles.quizErrorTitle : null]}>{title}</Text>
            <Text style={styles.quizStateMessage}>{message}</Text>
        </GlassCard>
    );
}

function toQuizOption(option: PublicQuizOption, question: PublicQuizQuestion): QuizOption {
    const isCorrect = option.id === question.correctOptionId;

    return {
        id: option.id,
        label: option.label,
        text: option.text,
        isCorrect,
        feedback: isCorrect ? 'Correct answer' : 'Review the explanation to see why another option fits better.',
    };
}

export function QuizScreen() {
    const params = useLocalSearchParams<RouteParams>();
    const articleId = getParamValue(params.id);
    const [quiz, setQuiz] = useState<PublicArticleQuiz | null>(null);
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
    const [quizError, setQuizError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadQuiz = async () => {
            setCurrentQuestionIndex(0);
            setSelectedOptionId(null);
            setRevealed(false);

            if (!articleId) {
                setQuiz(null);
                setQuizError('Missing article id in the route. Open a quiz from an article to load its public questions.');
                setIsLoadingQuiz(false);
                return;
            }

            setIsLoadingQuiz(true);
            setQuizError(null);

            try {
                const quizResponse = await getPublicArticleQuiz(articleId);

                if (isMounted) {
                    setQuiz(quizResponse);
                }
            } catch (error) {
                if (isMounted) {
                    setQuiz(null);
                    setQuizError(error instanceof Error ? error.message : 'Unable to load this public quiz right now.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingQuiz(false);
                }
            }
        };

        void loadQuiz();

        return () => {
            isMounted = false;
        };
    }, [articleId]);

    const questions = quiz?.questions ?? [];
    const safeQuestionIndex = Math.min(currentQuestionIndex, Math.max(questions.length - 1, 0));
    const question = questions[safeQuestionIndex];
    const options = question ? question.options.map((option) => toQuizOption(option, question)) : [];
    const selectedOption = options.find((option) => option.id === selectedOptionId);
    const isLastQuestion = safeQuestionIndex === questions.length - 1;
    const progress = questions.length > 0 ? (safeQuestionIndex + (revealed ? 1 : 0.35)) / questions.length : 0;
    const quizTitle = quiz?.title ?? 'Loading public quiz';

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
                subtitle={quizTitle}
                rightAccessory={<Pill label={questions.length > 0 ? `${safeQuestionIndex + 1}/${questions.length}` : 'Quiz'} tone="primary" icon="🎯" size="sm" />}
            />

            {isLoadingQuiz ? (
                <QuizStateCard title="Loading quiz" message="Fetching quiz questions from the public backend." isLoading />
            ) : quizError ? (
                <QuizStateCard title="Couldn’t load quiz" message={quizError} tone="error" />
            ) : quiz && questions.length === 0 ? (
                <>
                    <GlassCard variant="elevated" style={styles.quizCard}>
                        <View style={styles.quizTopRow}>
                            <View style={styles.quizIconBubble}>
                                <Text style={styles.quizIcon}>🔬</Text>
                            </View>
                            <View style={styles.quizMetaCopy}>
                                <Text style={styles.quizEyebrow}>Article quiz</Text>
                                <Text style={styles.quizMetaTitle}>{quiz.title}</Text>
                            </View>
                            <Pill label="Live API" tone="neutral" size="sm" />
                        </View>
                    </GlassCard>
                    <QuizStateCard
                        title="No quiz questions yet"
                        message="The backend returned this article’s quiz shell, but no questions are available."
                    />
                    <PrimaryButton title="Back to article" variant="ghost" onPress={() => router.push({ pathname: '/article/[id]', params: { id: quiz.articleId } })} />
                </>
            ) : quiz && question ? (
                <>
                    <GlassCard variant="elevated" style={styles.quizCard}>
                        <View style={styles.quizTopRow}>
                            <View style={styles.quizIconBubble}>
                                <Text style={styles.quizIcon}>🔬</Text>
                            </View>
                            <View style={styles.quizMetaCopy}>
                                <Text style={styles.quizEyebrow}>Article quiz</Text>
                                <Text style={styles.quizMetaTitle}>{quiz.title}</Text>
                            </View>
                            <Pill label="Live API" tone="neutral" size="sm" />
                        </View>
                        <ProgressBar progress={progress} label="Quiz progress" showPercent fillColor={colors.primary} />
                    </GlassCard>

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
                            {options.map((option) => (
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
                            onPress={() => router.push({ pathname: '/article/[id]', params: { id: quiz.articleId } })}
                        />
                    </GlassCard>
                </>
            ) : (
                <QuizStateCard title="No quiz loaded" message="Open a quiz from an article to load public questions." />
            )}

            <GlassCard variant="subtle" style={styles.staticNoteCard}>
                <Text style={styles.staticNoteTitle}>Local interaction only</Text>
                <Text style={styles.staticNoteText}>
                    Questions load from the backend public quiz API. Option selection and completion are local React state; no XP, progress, or scores are saved.
                </Text>
            </GlassCard>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        paddingBottom: 112,
    },
    quizStateCard: {
        gap: spacing.sm,
        borderRadius: radii.lg,
        alignItems: 'flex-start',
    },
    quizErrorCard: {
        borderColor: 'rgba(255,180,171,0.35)',
    },
    quizStateTitle: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '800',
    },
    quizErrorTitle: {
        color: colors.error,
    },
    quizStateMessage: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
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