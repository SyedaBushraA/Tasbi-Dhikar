import { router } from 'expo-router';

/** Closes the current screen, or shows the counter when there is nothing to go back to. */
export function leaveScreen(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Closes every screen above the tabs and shows the counter. */
export function returnToCounter(): void {
  if (router.canDismiss()) router.dismissTo('/');
  else router.replace('/');
}
