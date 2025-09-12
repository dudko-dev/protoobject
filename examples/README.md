# ProtoObject Examples

This directory contains practical examples of using the ProtoObject library in different scenarios and languages.

## Structure

### 📁 JavaScript (`javascript/`)

Examples for using ProtoObject in plain JavaScript:

- `user-classes.js` - Complete example showing factory pattern, inheritance, and serialization
- `demo.js` - Interactive demo showing all features

### 📁 TypeScript (`typescript/`)

Examples for using ProtoObject with TypeScript:

- `user-classes.ts` - Type-safe examples with decorators, interfaces, and generics
- `demo.ts` - Interactive demo with full type safety

### 📁 SQL Database (`sql-database/`)

Examples for using ProtoObject with SQL databases:

- `example-base-class.ts` - Base class for database records
- `example-heir-class.ts` - Specific table implementation

## Key Concepts Demonstrated

### 1. Factory Pattern vs Inheritance

- **Factory**: Use `protoObjectFactory()` for flexible class creation
- **Inheritance**: Extend `ProtoObject` for traditional OOP approach

### 2. Data Serialization

- **toJSON()**: Custom serialization for complex types (Date, Buffer, nested objects)
- **fromJSON()**: Custom deserialization with type conversion

### 3. TypeScript Features

- **Decorators**: `@StaticImplements` for compile-time validation
- **Generics**: Type-safe ProtoObject usage
- **Interfaces**: Defining contracts for your data classes

### 4. Field Assignment

**Important**: Always call `this.assign(data)` in constructors after `super()` to ensure proper field initialization.

```javascript
constructor(data) {
  super(data);
  if (data) this.assign(data); // This is crucial!
  return this;
}
```

## Running Examples

### JavaScript Examples

```bash
npm run build  # Build the library first
node examples/javascript/user-classes.js
```

### TypeScript Examples

```bash
npm run build  # Build the library first
npx tsx examples/typescript/user-classes.ts
```

### SQL Database Examples

```bash
npm run build  # Build the library first
npm run test:sql  # Run SQL tests
```

## Common Patterns

### Basic Class Creation

```javascript
class UserAddress extends ProtoObject {
  constructor(data) {
    super(data);
    if (data) this.assign(data);
    return this;
  }
  
  country;
  postCode;
}
```

### Custom Serialization

```javascript
toJSON() {
  return {
    ...super.toJSON.call(this),
    createdAt: this.createdAt.toJSON(),
    photo: this.photo instanceof Buffer ? this.photo.toString("hex") : undefined,
  };
}
```

### Type-Safe Factory (TypeScript)

```typescript
interface IUserRights extends ProtoObject<IUserRights> {
  isAdmin: boolean;
  updatedAt: Date;
}

const UserRights = protoObjectFactory<IUserRights>({
  // Implementation
});
```
