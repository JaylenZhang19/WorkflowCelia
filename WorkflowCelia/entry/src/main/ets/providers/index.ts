/**
 * Providers Module
 * External ability providers for cross-app communication
 */

// External ability providers
export { MockSmsAbilityProvider } from './MockSmsAbilityProvider';
export { MockEmailAbilityProvider } from './MockEmailAbilityProvider';
export {
  ExternalAbilityService,
  SmsParams,
  EmailParams,
  AbilityCallResult
} from './ExternalAbilityService';

// System providers
export { BatteryProvider, BatteryStatus } from './system/BatteryProvider';
export { DeviceInfoProvider, DeviceInfo, NetworkInfo } from './system/DeviceInfoProvider';
export { LocationProvider, Location, Address } from './system/LocationProvider';

// Notification provider
export { NotificationProvider, NotificationOptions } from './notification/NotificationProvider';

// Photos provider
export { PhotosProvider, Photo, Album, PhotosQuery } from './photos/PhotosProvider';

// Calendar provider
export { CalendarProvider, CalendarEvent, CalendarQuery } from './calendar/CalendarProvider';
