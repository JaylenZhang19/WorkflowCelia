# Ability Provider Layer Design

## Overview

This document describes the ability provider layer architecture for the Workflow application. The layer provides a unified interface for accessing capabilities regardless of their source (system APIs or third-party applications).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Engine                           │
├─────────────────────────────────────────────────────────────┤
│                   Ability Actions Layer                      │
│  (SendSmsAction, SetAlarmAction, WeChatMessageAction, etc.) │
├─────────────────────────────────────────────────────────────┤
│              Ability Communication Manager                   │
│     (Cross-app communication, protocol handling)             │
├─────────────────────────────────────────────────────────────┤
│                   Ability Registry                           │
│        (Ability discovery, registration, lookup)             │
├─────────────────────────────────────────────────────────────┤
│                   IAbilityProvider                           │
│         (Unified interface for all providers)                │
├──────────────┬──────────────────────────────────────────────┤
│   System     │           Third-Party Applications           │
│  Abilities   │  ┌─────────┬─────────┬─────────┬──────────┐ │
│ ┌──────────┐ │  │ WeChat  │ Taobao  │ Alipay  │  Others  │ │
│ │   SMS    │ │  └─────────┴─────────┴─────────┴──────────┘ │
│ ├──────────┤ │                                              │
│ │ Geofence │ │                                              │
│ ├──────────┤ │                                              │
│ │  Alarm   │ │                                              │
│ ├──────────┤ │                                              │
│ │  Device  │ │                                              │
│ │  Status  │ │                                              │
│ └──────────┘ │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

## Core Components

### 1. IAbilityProvider Interface

The foundational interface that all ability providers must implement:

```typescript
interface IAbilityProvider {
  getMeta(): AbilityMeta;
  getDefinition(): AbilityDefinition;
  execute(inputs: Record<string, any>, context: AbilityContext): Promise<AbilityResult>;
  isAvailable(): Promise<boolean>;
  initialize?(): Promise<void>;
  dispose?(): void;
}
```

### 2. AbilityCallProtocol

Unified protocol for cross-application communication:

**Message Types:**
- `INVOKE_REQUEST` / `INVOKE_RESPONSE` - Ability invocation
- `DISCOVER_REQUEST` / `DISCOVER_RESPONSE` - Ability discovery
- `AVAILABILITY_REQUEST` / `AVAILABILITY_RESPONSE` - Availability check
- `HEARTBEAT` - Connection health check
- `ERROR` - Error reporting

**Error Codes:**
- `TARGET_NOT_FOUND` - Target application not found
- `ABILITY_NOT_FOUND` - Specific ability not found
- `INVALID_PARAMETERS` - Invalid input parameters
- `PERMISSION_DENIED` - Missing required permissions
- `TIMEOUT` - Request timeout
- `INTERNAL_ERROR` - Internal execution error

### 3. AbilityRegistry

Central registry for all ability providers:

```typescript
const registry = AbilityRegistry.getInstance();

// Register an ability
registry.register('com.system.sms', new SmsAbility(), false);

// Get an ability
const smsAbility = registry.getAbility('com.system.sms');

// Discover abilities
const abilities = await registry.getAllAbilityInfo('communication');

// Get statistics
const stats = registry.getStats();
```

### 4. AbilityCommunicationManager

Handles cross-application communication:

```typescript
const manager = AbilityCommunicationManager.getInstance();

// Invoke an ability
const result = await manager.invokeAbility(
  'com.tencent.wechat',  // target bundle
  'sendmessage',         // target ability
  'send',                // action
  { contactName: '张三', content: 'Hello' }
);

// Discover abilities
const abilities = await manager.discoverAbilities('communication');

// Check availability
const available = await manager.checkAvailability('com.tencent.wechat', 'sendmessage');
```

## Ability Categories

```typescript
enum AbilityCategory {
  SYSTEM = 'system',           // System capabilities
  COMMUNICATION = 'communication',  // Messaging, calls
  MEDIA = 'media',             // Photos, videos, music
  LOCATION = 'location',       // GPS, maps
  CALENDAR = 'calendar',       // Events, reminders
  CONTACTS = 'contacts',       // Contact management
  HEALTH = 'health',           // Health data
  SMART_HOME = 'smart_home',   // IoT devices
  THIRD_PARTY = 'third_party'  // Third-party apps
}
```

## System Abilities

### SMS Ability
- **ID:** `com.system.sms`
- **Inputs:** `phoneNumber`, `content`
- **Outputs:** `messageId`, `status`

### Geofence Ability
- **ID:** `com.system.geofence`
- **Inputs:** `action`, `fence`, `fenceId`
- **Outputs:** `fenceId`, `fences`, `success`

### Alarm Ability
- **ID:** `com.system.alarm`
- **Inputs:** `action`, `alarm`, `alarmId`, `snoozeMinutes`
- **Outputs:** `alarmId`, `alarms`, `success`

### Device Status Ability
- **ID:** `com.system.devicestatus`
- **Inputs:** `statusType`
- **Outputs:** `status` (battery, network, storage, etc.)

## Third-Party Abilities

### WeChat Abilities

#### Send Message
- **ID:** `com.tencent.wechat.sendmessage`
- **Inputs:** `contactId`, `contactName`, `content`, `messageType`
- **Outputs:** `messageId`, `status`

#### Get Contacts
- **ID:** `com.tencent.wechat.getcontacts`
- **Inputs:** `searchQuery`
- **Outputs:** `contacts`

### Taobao Abilities

#### Search Products
- **ID:** `com.taobao.searchproducts`
- **Inputs:** `query`, `minPrice`, `maxPrice`, `limit`
- **Outputs:** `products`

#### Create Order
- **ID:** `com.taobao.createorder`
- **Inputs:** `productId`, `quantity`, `shippingAddress`
- **Outputs:** `orderId`, `totalAmount`

### Alipay Abilities

#### Payment
- **ID:** `com.alipay.payment`
- **Inputs:** `amount`, `recipient`, `description`
- **Outputs:** `transactionId`, `status`

## Usage Examples

### Initialize the Ability Layer

```typescript
import { initializeAbilityLayer } from './abilities';

await initializeAbilityLayer();
```

### Create and Execute an Action

```typescript
import { SendSmsAction, AbilityCommunicationManager } from './abilities';

// Create action
const action = new SendSmsAction();

// Execute
const result = await action.execute(
  { phoneNumber: '123456789', content: 'Hello!' },
  workflowContext
);
```

### Discover and Invoke Abilities

```typescript
import { AbilityCommunicationManager, AbilityRegistry } from './abilities';

const manager = AbilityCommunicationManager.getInstance();
const registry = AbilityRegistry.getInstance();

// Discover all communication abilities
const abilities = await manager.discoverAbilities('communication');

// Invoke a specific ability
const result = await manager.invokeAbility(
  'com.tencent.wechat',
  'sendmessage',
  'send',
  { contactName: '张三', content: '你好！' }
);
```

## Creating Custom Abilities

### Step 1: Implement IAbilityProvider

```typescript
import { IAbilityProvider, AbilityMeta, AbilityDefinition, 
         AbilityContext, AbilityResult, AbilityCategory } from './IAbilityProvider';
import { DataType } from './core/models/DataType';

class CustomAbility implements IAbilityProvider {
  private meta: AbilityMeta = {
    id: 'com.example.custom',
    name: 'Custom Ability',
    description: 'A custom ability',
    provider: 'com.example',
    version: '1.0.0',
    category: AbilityCategory.THIRD_PARTY,
    icon: '🔧',
    requiresConfirmation: false,
    permissions: []
  };

  private definition: AbilityDefinition = {
    meta: this.meta,
    inputs: [
      { name: 'input1', type: DataType.TEXT, required: true }
    ],
    outputs: [
      { name: 'result', type: DataType.TEXT, required: true }
    ]
  };

  getMeta(): AbilityMeta { return this.meta; }
  getDefinition(): AbilityDefinition { return this.definition; }

  async execute(inputs: Record<string, any>, context: AbilityContext): Promise<AbilityResult> {
    // Implementation
    return { success: true, outputs: { result: 'done' } };
  }

  async isAvailable(): Promise<boolean> { return true; }
}
```

### Step 2: Register the Ability

```typescript
const registry = AbilityRegistry.getInstance();
registry.register('com.example.custom', new CustomAbility(), false);
```

### Step 3: Use in Workflow

```typescript
const action = AbilityActionFactory.createAction('com.example.custom');
const result = await action.execute({ input1: 'value' }, context);
```

## Cross-App Communication Flow

```
Workflow App                    Target App
     │                              │
     │─── InvokeRequest ───────────>│
     │    (via WantAgent)           │
     │                              │
     │                              │ [Execute Ability]
     │                              │
     │<─── InvokeResponse ──────────│
     │    (result or error)         │
     │                              │
```

## Error Handling

```typescript
import { AbilityCommunicationManager, ProtocolErrorCode } from './abilities';

try {
  const result = await manager.invokeAbility(/* ... */);
} catch (error: any) {
  switch (error.code) {
    case ProtocolErrorCode.ABILITY_NOT_FOUND:
      console.error('Ability not found');
      break;
    case ProtocolErrorCode.PERMISSION_DENIED:
      console.error('Permission denied');
      break;
    case ProtocolErrorCode.TIMEOUT:
      console.error('Request timed out');
      break;
    default:
      console.error('Unknown error:', error.message);
  }
}
```

## File Structure

```
entry/src/main/ets/abilities/
├── IAbilityProvider.ts       # Core interfaces
├── AbilityCallProtocol.ts    # Communication protocol
├── AbilityRegistry.ts        # Ability registry
├── AbilityCommunicationManager.ts  # Communication manager
├── AbilityInit.ts            # Initialization
├── SystemAbilities.ts        # System abilities
├── ThirdPartyAbilities.ts    # Third-party abilities
├── index.ts                  # Module exports
├── examples/
│   └── AbilityExamples.ts    # Usage examples
```

## Integration with Workflow Engine

The ability layer integrates with the workflow engine through `AbilityBackedAction` classes:

```typescript
// In workflow engine
import { AbilityActionFactory } from './abilities';

// Create action for ability
const action = AbilityActionFactory.createAction('com.system.sms');

// Execute in workflow context
const result = await action.execute(inputs, workflowContext);
```

## Future Enhancements

1. **Remote Ability Discovery:** Implement WantAgent-based discovery for installed apps
2. **Permission Management:** Add runtime permission request handling
3. **Caching:** Cache ability metadata and availability status
4. **Rate Limiting:** Add rate limiting for ability invocations
5. **Transaction Support:** Support for transactional ability execution
6. **Event Subscription:** Support for subscribing to ability events (e.g., geofence triggers)
