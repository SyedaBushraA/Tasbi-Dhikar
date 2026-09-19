import * as Haptics from 'expo-haptics';

/*
 * Haptics are a nicety. A device without a vibration motor, or a failing
 * native call, must never get in the way of counting.
 */
function ignoreFailure(feedback: Promise<void>): void {
  feedback.catch(() => undefined);
}

/** Light feedback for a single count. */
export function tapFeedback(): void {
  ignoreFailure(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Stronger feedback when the target is reached. */
export function completionFeedback(): void {
  ignoreFailure(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Short feedback when a switch or option is changed. */
export function selectionFeedback(): void {
  ignoreFailure(Haptics.selectionAsync());
}
