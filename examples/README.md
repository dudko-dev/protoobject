# ProtoObject Usage Examples

This directory contains usage examples of the ProtoObject library for various scenarios.

## Examples Structure

### 📡 TCP Protocol Examples

- **tcp-chat/** - Simple TCP client-server chat
- **tcp-api/** - RESTful API over TCP connections  
- **tcp-nested/** - Nested ProtoObject classes for complex protocols

### 💾 File System Examples  

- **fs-backup/** - Object backup system
- **fs-csv/** - CSV export/import
- **fs-streaming/** - Streaming processing for large files

### 🔄 Stream Processing Examples

- **stream-validation/** - Object validation in streams
- **stream-transform/** - Data transformation
- **stream-batch/** - Batch processing

### 🔐 Crypto Examples

- **crypto-signing/** - Digital signatures for objects
- **crypto-encryption/** - Encryption of sensitive data
- **crypto-integrity/** - Data integrity verification

### 🗄️ SQLite Examples  

- **sqlite-orm/** - ORM-like behavior
- **sqlite-relations/** - Related objects
- **sqlite-migrations/** - Schema migrations

### 📁 Browser (`browser/`)

Browser compatibility examples:

- `browser-demo.html` - Interactive browser demonstration with core features
- Compatible with modern browsers (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Note: Streaming features require Node.js environment

### 📁 JavaScript (`javascript/`)

JavaScript examples:

- `user-classes.js` - Complete example with factory, inheritance and serialization
- `demo.js` - Interactive demonstration of all features

### 📁 TypeScript (`typescript/`)

TypeScript examples:

- `user-classes.ts` - Type-safe examples with decorators and generics
- `demo.ts` - Interactive demonstration with full typing

### 📁 SQL Database (`sql-database/`)

SQL database examples:

- `example-base-class.ts` - Base class for database records
- `example-heir-class.ts` - Concrete table implementation

## How to Run Examples

Each example contains:

- `README.md` - description and instructions
- `package.json` - dependencies (if needed)
- Source code with comments

```bash
cd examples/tcp-chat
npm install  # if package.json exists
node server.js  # in one terminal
node client.js  # in another terminal
```

## Requirements

- Node.js 18+ (for experimental SQLite features)
- TypeScript (for compiling .ts examples)

## Key Concepts

### 1. Factory vs Inheritance

- **Factory**: Use `protoObjectFactory()` for flexible class creation
- **Inheritance**: Inherit from `ProtoObject` for traditional OOP

### 2. Data Serialization

- **toJSON()**: Custom serialization for complex types (Date, Buffer, nested objects)
- **fromJSON()**: Custom deserialization with type conversion

### 3. TypeScript Features

- **Decorators**: `@StaticImplements` for compile-time validation
- **Generics**: Type-safe ProtoObject usage
- **Interfaces**: Define contracts for your data classes

### 4. Field Assignment

**Important**: Always call `this.assign(data)` in constructors after `super()` for proper field initialization.

```javascript
constructor(data) {
  super(data);
  if (data) this.assign(data); // This is required!
  return this;
}
```
