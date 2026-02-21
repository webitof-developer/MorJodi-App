# strings.xml: Limitations and Dynamic Config Solution

## The Problem
Android's `strings.xml` is a **compile-time resource** that gets baked into the APK during build. It **cannot be changed at runtime** without rebuilding and redistributing the app.

## Our Solution: Dynamic Configuration

Instead of relying on `strings.xml` for values that need to be configurable, we:

### 1. Fetch Settings from API
On app startup (`App.js`), we fetch public settings from `/api/settings/public` and store them in `global.__APP_ENV__`.

### 2. Use the `useAppSettings` Hook
Any component that needs app name, phone, email, etc. can use:

```javascript
import useAppSettings from '../hooks/useAppSettings';

function MyComponent() {
  const { appName, supportEmail, supportPhone } = useAppSettings();
  
  return (
    <View>
      <Text>{appName}</Text>
      <Text>Email: {supportEmail}</Text>
      <Text>Phone: {supportPhone}</Text>
    </View>
  );
}
```

### 3. strings.xml as Fallback
Keep default values in `strings.xml` for:
- App name (shown before settings load)
- Offline scenarios
- Build configuration

## What Can Be Dynamic?

✅ **Can be dynamic (using our system):**
- App name (display in UI)
- Support email
- Support phone
- Facebook App ID (programmatically)
- All analytics IDs

❌ **Cannot be dynamic (requires rebuild):**
- App name in launcher (AndroidManifest.xml)
- Package name
- Permissions

## Example: Dynamic Facebook App ID

While `strings.xml` has a placeholder, the actual value is set programmatically:

```javascript
// In App.js or a dedicated setup file
import { Settings } from 'react-native-fbsdk-next';

const { fbAppId } = useAppSettings();
if (fbAppId) {
  Settings.setAppID(fbAppId);
}
```

This way, admins can update the Facebook App ID in the Admin Panel without rebuilding the app!
