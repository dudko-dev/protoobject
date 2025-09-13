# Browser Example

This example demonst# Browser-compatible imports only
import { 
  ProtoObject, 
  StaticImplements,
  protoObjectFactory,
  ProtoObjectBrowserStorage  // Universal browser storage utility
} from 'protoobject/browser';rotoObject working directly in the browser without Node.js dependencies.

## Files

- `browser-demo.html` - Interactive demo page with all browser features

## Features Demonstrated

- ✅ Basic ProtoObject functionality (create, serialize, deserialize)
- ✅ JSON serialization/deserialization
- ✅ LocalStorage integration with ProtoObjectBrowserStorage
- ✅ Fetch API integration  
- ✅ Performance testing
- ✅ Environment detection
- ✅ Error handling
- ✅ Array storage and retrieval
- ✅ Key management and filtering
- ✅ Backup and restore functionality

## How to Run

1. Open `browser-demo.html` in any modern browser for all features
2. Use the interactive buttons to test different features
3. Check browser console for detailed logs

## Browser Requirements

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- ES6+ support
- ES Modules support

## Import for Browser

```javascript
// Browser-compatible imports only
import { 
  ProtoObject, 
  StaticImplements,
  protoObjectFactory,
  ProtoObjectLocalStorage  // New localStorage utility
} from 'protoobject/browser';
```

## What Works in Browser

✅ Core ProtoObject functionality
✅ JSON serialization/deserialization
✅ localStorage/sessionStorage integration with ProtoObjectBrowserStorage
✅ Fetch API integration
✅ IndexedDB integration
✅ WebSocket integration
✅ Performance API
✅ Array storage and management
✅ Key filtering and prefix operations
✅ Backup and restore functionality

## What Doesn't Work in Browser

❌ ProtoObjectSQLite (requires node:sqlite)
❌ ProtoObjectTCP (requires node:net)  
❌ ProtoObjectCrypto (requires node:crypto)
❌ ProtoObjectFS (requires node:fs)
❌ ProtoObjectStream (requires node:stream)

Use browser alternatives:

- SQLite → IndexedDB
- TCP → WebSockets/Fetch
- Crypto → Web Crypto API
- FS → localStorage/IndexedDB/Fetch
- Stream → Fetch Streams/ReadableStream
