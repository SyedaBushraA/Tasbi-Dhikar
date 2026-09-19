import { Redirect } from 'expo-router';

/** Any unknown address leads back to the counter instead of a dead end. */
export default function NotFound() {
  return <Redirect href="/" />;
}
