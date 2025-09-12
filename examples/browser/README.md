# Browser Example

This example demonstrates ProtoObject working directly in the browser without Node.js dependencies.

## Files

- `browser-demo.html` - Interactive demo page with all browser features

## Features Demonstrated

- ✅ Basic ProtoObject functionality (create, serialize, deserialize)
- ✅ JSON serialization/deserialization
- ✅ LocalStorage integration
- ✅ Fetch API integration  
- ✅ Performance testing
- ✅ Environment detection
- ✅ Error handling

## How to Run

1. Open `browser-demo.html` in any modern browser
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
  protoObjectFactory 
} from 'protoobject/browser';
```

## What Works in Browser

✅ Core ProtoObject functionality
✅ JSON serialization/deserialization
✅ localStorage/sessionStorage integration
✅ Fetch API integration
✅ IndexedDB integration
✅ WebSocket integration
✅ Performance API

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
