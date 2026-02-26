import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();
const pendingNavigationQueue = [];

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
    return;
  }

  pendingNavigationQueue.push({ name, params });
}

export function flushPendingNavigation() {
  if (!navigationRef.isReady() || pendingNavigationQueue.length === 0) return;

  while (pendingNavigationQueue.length > 0) {
    const nextAction = pendingNavigationQueue.shift();
    if (nextAction?.name) {
      navigationRef.navigate(nextAction.name, nextAction.params);
    }
  }
}
