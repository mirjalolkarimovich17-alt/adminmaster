const tg = () => window.Telegram?.WebApp?.HapticFeedback

export const haptic = {
  light: () => tg()?.impactOccurred('light'),
  medium: () => tg()?.impactOccurred('medium'),
  heavy: () => tg()?.impactOccurred('heavy'),
  success: () => tg()?.notificationOccurred('success'),
  error: () => tg()?.notificationOccurred('error'),
  select: () => tg()?.selectionChanged(),
}
