# @dbcube/query-builder

## Language/Lenguaje

- [English](#english-documentation)
- [Español](#documentación-en-español)

---

## English documentation

## Table of contents 🚀

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Basic Usage](#basic-usage)
  - [Database Connection](#database-connection)
- [Table Operations](#table-operations)
- [CRUD Operations](#crud-operations)
  - [Inserting Data](#inserting-data)
  - [Selecting Data](#selecting-data)
  - [Updating Data](#updating-data)
  - [Deleting Data](#deleting-data)
- [Advanced Queries](#advanced-queries)
  - [WHERE Query](#where-query)
  - [OR WHERE Query](#or-where-query)
  - [WHERE Condition Groups](#where-condition-groups)
  - [BETWEEN Query](#between-query)
  - [IN Query](#in-query)
  - [IS NULL / IS NOT NULL Query](#is-null--is-not-null-query)
  - [JOIN Query](#join-query)
  - [LEFT JOIN Query](#left-join-query)
  - [RIGHT JOIN Query](#right-join-query)
  - [ORDER BY Query](#order-by-query)
  - [LIMIT and OFFSET Query (Pagination)](#limit-and-offset-query-pagination)
  - [GROUP BY Query](#group-by-query)
  - [DISTINCT Query](#distinct-query)
- [Aggregate Functions](#aggregate-functions)
  - [count](#count)
  - [sum](#sum)
  - [avg](#avg)
  - [max](#max)
  - [min](#min)
- [Finding Records](#finding-records)
  - [find](#find)
  - [first](#first)
- [Computed Fields and Triggers](#computed-fields-and-triggers)
- [Executing Raw SQL Queries](#executing-raw-sql-queries)
  - [Error Handling](#error-handling)
- [Complete API](#complete-api)
  - [Database Class](#database-class)
  - [Table Class](#table-class)
- [Multi-Database Support](#multi-database-support)
- [Advanced Features](#advanced-features)
- [License](#license)

## Introduction

`@dbcube/query-builder` is a lightweight, flexible, and fluent Node.js library designed to build queries across multiple database engines, including MySQL, PostgreSQL, SQLite, and MongoDB, using JavaScript/TypeScript. 

Its agnostic design allows you to generate data manipulation (DML) and data definition (DDL) operations with a clean, chainable syntax—without sacrificing power or expressiveness. It's designed to work seamlessly in both SQL and NoSQL environments, providing a consistent abstraction layer across different storage technologies while still leveraging the native capabilities of each engine.

**Key differentiator**: Unlike other query builders that focus on a single database type, DBCube Query Builder provides a unified API that works across SQL and NoSQL databases, making it perfect for modern polyglot architectures.

## Features

- **Multi-Database Support**: MySQL, PostgreSQL, SQLite, and MongoDB
- **Fluent API** for building SQL queries with chainable methods
- **Type-safe** query construction with TypeScript support
- **Complete CRUD Operations**: SELECT, INSERT, UPDATE, DELETE
- **Advanced WHERE conditions** (AND, OR, groups, BETWEEN, IN, NULL checks)
- **JOIN Support**: INNER, LEFT, RIGHT joins
- **Aggregations**: COUNT, SUM, AVG, MAX, MIN
- **Query Modifiers**: ORDER BY, GROUP BY, DISTINCT, LIMIT/OFFSET
- **Computed Fields**: Dynamic field calculations
- **Triggers**: Before/after operation hooks
- **Promise-based asynchronous API**
- **Connection pooling** through @dbcube/core
- **Error handling** with descriptive messages
- **Cross-platform compatibility** (Windows, macOS, Linux)

## Installation

```bash
npm install @dbcube/query-builder
```

## Configuration

DBCube Query Builder works with the DBCube ecosystem. Make sure you have the proper database configuration through @dbcube/core.

```typescript
// No explicit configuration needed - works through DBCube core
import { Database } from "@dbcube/query-builder";
```

## Basic Usage

### Database Connection

The connection is automatically managed through the DBCube core system.

```typescript
import { Database } from "@dbcube/query-builder";

// Create a database instance
const db = new Database("my_database");

// Get a table reference
const usersTable = db.table("users");
```

## Table Operations

DBCube Query Builder focuses on data operations. Table creation and schema management are handled by other DBCube components.

```typescript
// Access table for operations
const usersTable = db.table("users");
```

## CRUD Operations

### Inserting Data

Use the `insert` method to add new records to a table.

```typescript
// Insert single record
const newUser = await usersTable.insert([
  { name: "Alice", email: "alice@example.com", age: 28 }
]);

// Insert multiple records
const newUsers = await usersTable.insert([
  { name: "Alice", email: "alice@example.com", age: 28 },
  { name: "Bob", email: "bob@example.com", age: 32 },
  { name: "Charlie", email: "charlie@example.com", age: 35 }
]);

console.log(newUsers);
// Returns the inserted records with generated IDs
```

### Selecting Data

Use the `select` method to specify columns and `get()` to retrieve data.

```typescript
// Select all columns
const allUsers = await usersTable.get();

// Select specific columns
const users = await usersTable
  .select(["id", "name", "email"])
  .get();

// Select with conditions
const activeUsers = await usersTable
  .select(["name", "email"])
  .where("status", "=", "active")
  .orderBy("created_at", "DESC")
  .limit(10)
  .get();

console.log(users);
// [{ id: 1, name: 'Alice', email: 'alice@example.com' }, ...]
```

### Updating Data

Use the `update` method to modify existing records. **Requires WHERE conditions**.

```typescript
// Update single field
await usersTable
  .where("id", "=", 1)
  .update({ age: 29 });

// Update multiple fields
await usersTable
  .where("email", "=", "alice@example.com")
  .update({ 
    name: "Alice Smith", 
    age: 29,
    updated_at: new Date()
  });

// Update with complex conditions
await usersTable
  .where("age", ">", 30)
  .where("status", "=", "inactive")
  .update({ status: "archived" });
```

### Deleting Data

Use the `delete` method to remove records. **Requires WHERE conditions**.

```typescript
// Delete specific record
await usersTable
  .where("id", "=", 2)
  .delete();

// Delete with conditions
await usersTable
  .where("status", "=", "deleted")
  .where("created_at", "<", "2023-01-01")
  .delete();
```

## Advanced Queries

### WHERE Query

Filter records using the `where` method with various operators.

```typescript
// Basic comparisons
const adultUsers = await usersTable.where("age", ">", 18).get();
const exactMatch = await usersTable.where("name", "=", "Alice").get();
const notEqual = await usersTable.where("status", "!=", "deleted").get();

// String operations
const emailUsers = await usersTable.where("email", "LIKE", "%@gmail.com").get();

console.log(adultUsers);
// [{ id: 1, name: 'Alice', age: 28 }, ...]
```

### OR WHERE Query

Use `orWhere` to add OR conditions to your query.

```typescript
const users = await usersTable
  .where("age", ">", 25)
  .orWhere("name", "=", "Alice")
  .get();

// Complex OR conditions
const premiumUsers = await usersTable
  .where("subscription", "=", "premium")
  .orWhere("total_purchases", ">", 1000)
  .orWhere("member_since", "<", "2020-01-01")
  .get();

console.log(users);
// [{ id: 1, name: 'Alice', age: 28 }, ...]
```

### WHERE Condition Groups

Group conditions using `whereGroup` for complex logic.

```typescript
// (age > 25 OR name = 'Jane') AND status = 'active'
const users = await usersTable
  .whereGroup((query) => {
    query.where("age", ">", 25).orWhere("name", "=", "Jane");
  })
  .where("status", "=", "active")
  .get();

// Nested groups
const complexQuery = await usersTable
  .whereGroup((query) => {
    query.where("country", "=", "US").orWhere("country", "=", "CA");
  })
  .where("active", "=", true)
  .whereGroup((query) => {
    query.where("age", ">=", 21).orWhere("verified", "=", true);
  })
  .get();
```

### BETWEEN Query

Search for values within a range using `whereBetween`.

```typescript
// Age between 25 and 35
const users = await usersTable.whereBetween("age", [25, 35]).get();

// Date ranges
const recentUsers = await usersTable
  .whereBetween("created_at", ["2024-01-01", "2024-12-31"])
  .get();

console.log(users);
// [{ id: 1, name: 'Alice', age: 28 }, { id: 2, name: 'Bob', age: 32 }]
```

### IN Query

Search for values that match a set of values using `whereIn`.

```typescript
// Specific IDs
const users = await usersTable.whereIn("id", [1, 3, 5]).get();

// Multiple statuses
const filteredUsers = await usersTable
  .whereIn("status", ["active", "pending", "verified"])
  .get();

// String values
const emailDomains = await usersTable
  .whereIn("email_domain", ["gmail.com", "yahoo.com", "hotmail.com"])
  .get();

console.log(users);
// [{ id: 1, name: 'Alice', age: 28 }, { id: 3, name: 'Charlie', age: 35 }]
```

### IS NULL / IS NOT NULL Query

Search for null or non-null values using `whereNull` and `whereNotNull`.

```typescript
// Users without email
const usersWithoutEmail = await usersTable.whereNull("email").get();

// Users with email
const usersWithEmail = await usersTable.whereNotNull("email").get();

// Combine with other conditions
const incompleteProfiles = await usersTable
  .whereNull("phone")
  .orWhere("avatar", "IS NULL")
  .whereNotNull("email")
  .get();
```

### JOIN Query

Join tables using the `join` method for INNER JOIN.

```typescript
// Basic INNER JOIN
const usersWithOrders = await usersTable
  .join("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id", "orders.total"])
  .get();

// Multiple JOINs
const detailedOrders = await usersTable
  .join("orders", "users.id", "=", "orders.user_id")
  .join("order_items", "orders.id", "=", "order_items.order_id")
  .join("products", "order_items.product_id", "=", "products.id")
  .select(["users.name", "orders.order_id", "products.name AS product_name"])
  .get();

console.log(usersWithOrders);
// [{ name: 'Alice', order_id: 101, total: 150.00 }, ...]
```

### LEFT JOIN Query

Perform a left join using the `leftJoin` method.

```typescript
// Include users even if they have no orders
const usersWithOrders = await usersTable
  .leftJoin("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id"])
  .get();

// Left join with aggregation
const usersOrderCount = await usersTable
  .leftJoin("orders", "users.id", "=", "orders.user_id")
  .select(["users.name"])
  .count("orders.id")
  .groupBy("users.id")
  .get();

console.log(usersWithOrders);
// [{ name: 'Alice', order_id: 101 }, { name: 'Bob', order_id: null }, ...]
```

### RIGHT JOIN Query

Perform a right join using the `rightJoin` method.

```typescript
// Include orders even if user data is missing
const ordersWithUsers = await usersTable
  .rightJoin("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id"])
  .get();

console.log(ordersWithUsers);
// [{ name: 'Alice', order_id: 101 }, { name: null, order_id: 102 }, ...]
```

### ORDER BY Query

Sort results using the `orderBy` method.

```typescript
// Single column sorting
const sortedUsers = await usersTable
  .orderBy("name", "ASC")
  .get();

// Multiple column sorting
const complexSort = await usersTable
  .orderBy("country", "ASC")
  .orderBy("age", "DESC")
  .orderBy("name", "ASC")
  .get();

// Sort with conditions
const recentActiveUsers = await usersTable
  .where("status", "=", "active")
  .orderBy("last_login", "DESC")
  .limit(20)
  .get();

console.log(sortedUsers);
// [{ id: 1, name: 'Alice', ... }, { id: 2, name: 'Bob', ... }]
```

### LIMIT and OFFSET Query (Pagination)

Limit the number of results and implement pagination using `limit` and `page`.

```typescript
// Simple limit
const firstTenUsers = await usersTable.limit(10).get();

// Pagination
const firstPage = await usersTable.limit(5).page(1).get();
const secondPage = await usersTable.limit(5).page(2).get();

// Pagination with sorting
const paginatedUsers = await usersTable
  .orderBy("created_at", "DESC")
  .limit(10)
  .page(3) // Skip first 20 records (pages 1-2)
  .get();

console.log(firstPage);   // Records 1-5
console.log(secondPage);  // Records 6-10
```

### GROUP BY Query

Group results using the `groupBy` method.

```typescript
// Simple grouping
const usersByAge = await usersTable
  .select(["age"])
  .count("*")
  .groupBy("age")
  .get();

// Multiple grouping columns
const usersByCountryAndAge = await usersTable
  .select(["country", "age"])
  .count("*")
  .groupBy("country")
  .groupBy("age")
  .get();

console.log(usersByAge);
// [{ age: 28, count: 2 }, { age: 32, count: 1 }]
```

### DISTINCT Query

Retrieve unique records using the `distinct` method.

```typescript
// Distinct values
const uniqueCountries = await usersTable
  .distinct()
  .select(["country"])
  .get();

// Distinct with conditions
const activeUserCountries = await usersTable
  .distinct()
  .select(["country"])
  .where("status", "=", "active")
  .get();

console.log(uniqueCountries);
// [{ country: 'USA' }, { country: 'Canada' }, { country: 'UK' }]
```

## Aggregate Functions

### count

Count the number of records.

```typescript
// Count all records
const totalUsers = await usersTable.count().first();
console.log(totalUsers); // { count: 150 }

// Count specific column
const usersWithEmail = await usersTable.count("email").first();

// Count with conditions
const activeUsers = await usersTable
  .where("status", "=", "active")
  .count()
  .first();
```

### sum

Calculate the sum of a column.

```typescript
// Sum of ages
const totalAge = await usersTable.sum("age").first();
console.log(totalAge); // { sum: 4250 }

// Sum with conditions
const premiumRevenue = await usersTable
  .join("orders", "users.id", "=", "orders.user_id")
  .where("users.subscription", "=", "premium")
  .sum("orders.total")
  .first();
```

### avg

Calculate the average of a column.

```typescript
// Average age
const averageAge = await usersTable.avg("age").first();
console.log(averageAge); // { avg: 28.33 }

// Average with grouping
const avgAgeByCountry = await usersTable
  .select(["country"])
  .avg("age")
  .groupBy("country")
  .get();
```

### max

Find the maximum value in a column.

```typescript
// Oldest user
const maxAge = await usersTable.max("age").first();
console.log(maxAge); // { max: 65 }

// Most recent registration
const latestUser = await usersTable.max("created_at").first();
```

### min

Find the minimum value in a column.

```typescript
// Youngest user
const minAge = await usersTable.min("age").first();
console.log(minAge); // { min: 18 }

// Earliest registration
const firstUser = await usersTable.min("created_at").first();
```

## Finding Records

### find

Find a record by a specific column value (defaults to 'id').

```typescript
// Find by ID (default)
const user = await usersTable.find(1);
console.log(user);
// { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 }

// Find by specific column
const userByEmail = await usersTable.find("alice@example.com", "email");

// Find returns null if not found
const nonExistent = await usersTable.find(999);
console.log(nonExistent); // null
```

### first

Get only the first record that meets the conditions.

```typescript
// First user matching condition
const firstUser = await usersTable
  .where("age", ">", 25)
  .orderBy("created_at", "ASC")
  .first();

// First user in general
const oldestAccount = await usersTable
  .orderBy("created_at", "ASC")
  .first();

console.log(firstUser);
// { id: 1, name: 'Alice', age: 28, ... } or null if no match
```

## Computed Fields and Triggers

DBCube Query Builder supports computed fields and triggers for advanced data processing.

```typescript
// Enable computed fields (processed automatically)
await db.useComputes();

// Enable triggers
await db.useTriggers();

// Triggers and computed fields are configured through other DBCube components
```

## Executing Raw SQL Queries

For complex queries that require raw SQL, use the underlying engine.

```typescript
// Access the underlying engine for raw queries
// (Implementation depends on your specific DBCube core setup)

// Note: Raw SQL queries bypass the query builder's abstraction layer
// and are database-specific
```

### Error Handling

The library provides comprehensive error handling with descriptive messages.

```typescript
try {
  // This will throw an error - UPDATE requires WHERE conditions
  await usersTable.update({ name: "Updated" });
} catch (error) {
  console.error(error.message);
  // "You must specify at least one WHERE condition to perform an update."
}

try {
  // This will throw an error - invalid data format
  await usersTable.insert("invalid data");
} catch (error) {
  console.error(error.message);
  // "The insert method requires an array of objects with key-value pairs."
}

// Connection and database errors are also properly handled
try {
  const result = await usersTable.get();
} catch (error) {
  // Database connection or query execution errors
  console.error("Database error:", error);
}
```

## Complete API

### Database Class

#### `new Database(name: string)`

Creates a new database connection instance.

```typescript
const db = new Database("my_database");
```

#### `table(tableName: string): Table`

Returns a Table instance for building queries on the specified table.

```typescript
const usersTable = db.table("users");
```

#### `useComputes(): Promise<void>`

Enables computed fields processing for the database.

```typescript
await db.useComputes();
```

#### `useTriggers(): Promise<void>`

Enables trigger processing for the database.

```typescript
await db.useTriggers();
```

#### `connect(): Promise<void>`

Establishes database connection (handled automatically).

#### `disconnect(): Promise<void>`

Closes database connection.

### Table Class

#### Query Building Methods

**`select(fields?: string[]): Table`**
Specify columns to select.

```typescript
usersTable.select(["id", "name", "email"]);
```

**`where(column, operator, value): Table`**
Add a WHERE condition.

```typescript
usersTable.where("age", ">", 25);
usersTable.where("email", "IS NOT NULL");
```

**`orWhere(column, operator, value): Table`**
Add an OR WHERE condition.

```typescript
usersTable.orWhere("name", "=", "Jane");
```

**`whereGroup(callback): Table`**
Grouped WHERE conditions.

```typescript
usersTable.whereGroup((query) => {
  query.where("age", ">", 25).orWhere("name", "=", "Jane");
});
```

**`whereBetween(column, [min, max]): Table`**
WHERE BETWEEN condition.

```typescript
usersTable.whereBetween("age", [25, 35]);
```

**`whereIn(column, values): Table`**
WHERE IN condition.

```typescript
usersTable.whereIn("id", [1, 3, 5]);
```

**`whereNull(column): Table`** / **`whereNotNull(column): Table`**
NULL checks.

```typescript
usersTable.whereNull("deleted_at");
usersTable.whereNotNull("email");
```

**`join(table, column1, operator, column2): Table`**
INNER JOIN.

```typescript
usersTable.join("orders", "users.id", "=", "orders.user_id");
```

**`leftJoin(table, column1, operator, column2): Table`**
LEFT JOIN.

**`rightJoin(table, column1, operator, column2): Table`**
RIGHT JOIN.

**`orderBy(column, direction): Table`**
ORDER BY clause.

```typescript
usersTable.orderBy("name", "ASC");
```

**`groupBy(column): Table`**
GROUP BY clause.

**`distinct(): Table`**
DISTINCT clause.

**`limit(number): Table`**
LIMIT clause.

**`page(number): Table`**
Pagination (requires limit).

#### Aggregation Methods

**`count(column?): Table`**
COUNT aggregation.

**`sum(column): Table`**
SUM aggregation.

**`avg(column): Table`**
AVG aggregation.

**`max(column): Table`**
MAX aggregation.

**`min(column): Table`**
MIN aggregation.

#### Execution Methods

**`get(): Promise<DatabaseRecord[]>`**
Execute and return all matching rows.

**`first(): Promise<DatabaseRecord | null>`**
Execute and return the first matching row.

**`find(value, column?): Promise<DatabaseRecord | null>`**
Find a row by column value (default: id).

**`insert(data): Promise<DatabaseRecord[]>`**
Insert one or more rows.

**`update(data): Promise<any>`**
Update rows matching the conditions.

**`delete(): Promise<any>`**
Delete rows matching the conditions.

## Multi-Database Support

DBCube Query Builder works with multiple database engines:

```typescript
// MySQL
const mysqlDb = new Database("mysql_database");

// PostgreSQL  
const postgresDb = new Database("postgres_database");

// SQLite
const sqliteDb = new Database("sqlite_database");

// MongoDB
const mongoDb = new Database("mongo_database");

// Same API works across all databases
const users = await mysqlDb.table("users").get();
const posts = await postgresDb.table("posts").get();
const logs = await sqliteDb.table("logs").get();
const analytics = await mongoDb.table("analytics").get();
```

## Advanced Features

### Complex Query Example

```typescript
// Complex business query
const monthlyReport = await db.table("orders")
  .join("users", "orders.user_id", "=", "users.id")
  .join("order_items", "orders.id", "=", "order_items.order_id")
  .join("products", "order_items.product_id", "=", "products.id")
  .select([
    "users.country",
    "products.category"
  ])
  .sum("order_items.quantity * order_items.price")
  .where("orders.status", "=", "completed")
  .whereBetween("orders.created_at", ["2024-01-01", "2024-01-31"])
  .groupBy("users.country")
  .groupBy("products.category")
  .orderBy("sum", "DESC")
  .limit(10)
  .get();
```

### Method Chaining

All query builder methods return the Table instance, enabling fluent method chaining:

```typescript
const result = await db
  .table("users")
  .select(["name", "email", "country"])
  .where("active", "=", true)
  .whereNotNull("email_verified_at")
  .whereGroup((query) => {
    query.where("subscription", "=", "premium")
         .orWhere("total_orders", ">", 10);
  })
  .join("user_profiles", "users.id", "=", "user_profiles.user_id")
  .orderBy("users.created_at", "DESC")
  .limit(50)
  .page(1)
  .get();
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Documentación en español

## Tabla de contenidos 🚀

- [Introducción](#introducción)
- [Características](#características-1)
- [Instalación](#instalación-1)
- [Configuración](#configuración-1)
- [Uso básico](#uso-básico)
  - [Conexión a la base de datos](#conexión-a-la-base-de-datos)
- [Operaciones de tabla](#operaciones-de-tabla)
- [Operaciones CRUD](#operaciones-crud-1)
  - [Insertar datos](#insertar-datos)
  - [Seleccionar datos](#seleccionar-datos)
  - [Actualizar datos](#actualizar-datos)
  - [Eliminar datos](#eliminar-datos)
- [Consultas avanzadas](#consultas-avanzadas-1)
  - [Consulta con WHERE](#consulta-con-where)
  - [Consulta con OR WHERE](#consulta-con-or-where)
  - [Consulta con grupos de condiciones WHERE](#consulta-con-grupos-de-condiciones-where)
  - [Consulta con BETWEEN](#consulta-con-between)
  - [Consulta con IN](#consulta-con-in)
  - [Consulta con IS NULL / IS NOT NULL](#consulta-con-is-null--is-not-null)
  - [Consulta con JOIN](#consulta-con-join)
  - [Consulta con LEFT JOIN](#consulta-con-left-join)
  - [Consulta con RIGHT JOIN](#consulta-con-right-join)
  - [Consulta con ORDER BY](#consulta-con-order-by)
  - [Consulta con LIMIT y OFFSET](#consulta-con-limit-y-offset-paginación)
  - [Consulta con GROUP BY](#consulta-con-group-by)
  - [Consulta con DISTINCT](#consulta-con-distinct)
- [Funciones de agregación](#funciones-de-agregación-1)
  - [count](#count-1)
  - [sum](#sum-1)
  - [avg](#avg-1)
  - [max](#max-1)
  - [min](#min-1)
- [Buscar registros](#buscar-registros)
  - [find](#find-1)
  - [first](#first-1)
- [Campos calculados y triggers](#campos-calculados-y-triggers)
- [Ejecutar consultas SQL crudas](#ejecutar-consultas-sql-crudas)
  - [Manejo de errores](#manejo-de-errores)
- [API completa](#api-completa-1)
  - [Clase Database](#clase-database)
  - [Clase Table](#clase-table)
- [Soporte multi-base de datos](#soporte-multi-base-de-datos)
- [Características avanzadas](#características-avanzadas)
- [Licencia](#licencia)

## Introducción

`@dbcube/query-builder` es una biblioteca de Node.js ligera, flexible y fluida diseñada para construir consultas a través de múltiples motores de base de datos, incluyendo MySQL, PostgreSQL, SQLite y MongoDB, usando JavaScript/TypeScript.

Su diseño agnóstico te permite generar operaciones de manipulación de datos (DML) y definición de datos (DDL) con una sintaxis limpia y encadenable, sin sacrificar potencia o expresividad. Está diseñada para trabajar perfectamente en entornos SQL y NoSQL, proporcionando una capa de abstracción consistente a través de diferentes tecnologías de almacenamiento mientras aprovecha las capacidades nativas de cada motor.

**Diferenciador clave**: A diferencia de otros constructores de consultas que se enfocan en un solo tipo de base de datos, DBCube Query Builder proporciona una API unificada que funciona a través de bases de datos SQL y NoSQL, haciéndola perfecta para arquitecturas políglotas modernas.

## Características

- **Soporte multi-base de datos**: MySQL, PostgreSQL, SQLite y MongoDB
- **API fluida** para construir consultas SQL con métodos encadenables
- **Construcción de consultas type-safe** con soporte TypeScript
- **Operaciones CRUD completas**: SELECT, INSERT, UPDATE, DELETE
- **Condiciones WHERE avanzadas** (AND, OR, grupos, BETWEEN, IN, verificaciones NULL)
- **Soporte JOIN**: INNER, LEFT, RIGHT joins
- **Agregaciones**: COUNT, SUM, AVG, MAX, MIN
- **Modificadores de consulta**: ORDER BY, GROUP BY, DISTINCT, LIMIT/OFFSET
- **Campos calculados**: Cálculos dinámicos de campos
- **Triggers**: Hooks antes/después de operaciones
- **API asíncrona basada en promesas**
- **Connection pooling** a través de @dbcube/core
- **Manejo de errores** con mensajes descriptivos
- **Compatibilidad multiplataforma** (Windows, macOS, Linux)

## Instalación

```bash
npm install @dbcube/query-builder
```

## Configuración

DBCube Query Builder funciona con el ecosistema DBCube. Asegúrate de tener la configuración adecuada de base de datos a través de @dbcube/core.

```typescript
// No se necesita configuración explícita - funciona a través de DBCube core
import { Database } from "@dbcube/query-builder";
```

## Uso básico

### Conexión a la base de datos

La conexión se gestiona automáticamente a través del sistema core de DBCube.

```typescript
import { Database } from "@dbcube/query-builder";

// Crear una instancia de base de datos
const db = new Database("mi_base_de_datos");

// Obtener una referencia de tabla
const tablaUsuarios = db.table("usuarios");
```

## Operaciones de tabla

DBCube Query Builder se enfoca en operaciones de datos. La creación de tablas y gestión de esquemas se maneja por otros componentes de DBCube.

```typescript
// Acceder a tabla para operaciones
const tablaUsuarios = db.table("usuarios");
```

## Operaciones CRUD

### Insertar datos

Utiliza el método `insert` para añadir nuevos registros a una tabla.

```typescript
// Insertar un solo registro
const nuevoUsuario = await tablaUsuarios.insert([
  { nombre: "Alicia", email: "alicia@ejemplo.com", edad: 28 }
]);

// Insertar múltiples registros
const nuevosUsuarios = await tablaUsuarios.insert([
  { nombre: "Alicia", email: "alicia@ejemplo.com", edad: 28 },
  { nombre: "Roberto", email: "roberto@ejemplo.com", edad: 32 },
  { nombre: "Carlos", email: "carlos@ejemplo.com", edad: 35 }
]);

console.log(nuevosUsuarios);
// Devuelve los registros insertados con IDs generados
```

### Seleccionar datos

Utiliza el método `select` para especificar columnas y `get()` para recuperar datos.

```typescript
// Seleccionar todas las columnas
const todosUsuarios = await tablaUsuarios.get();

// Seleccionar columnas específicas
const usuarios = await tablaUsuarios
  .select(["id", "nombre", "email"])
  .get();

// Seleccionar con condiciones
const usuariosActivos = await tablaUsuarios
  .select(["nombre", "email"])
  .where("estado", "=", "activo")
  .orderBy("fecha_creacion", "DESC")
  .limit(10)
  .get();

console.log(usuarios);
// [{ id: 1, nombre: 'Alicia', email: 'alicia@ejemplo.com' }, ...]
```

### Actualizar datos

Utiliza el método `update` para modificar registros existentes. **Requiere condiciones WHERE**.

```typescript
// Actualizar un campo
await tablaUsuarios
  .where("id", "=", 1)
  .update({ edad: 29 });

// Actualizar múltiples campos
await tablaUsuarios
  .where("email", "=", "alicia@ejemplo.com")
  .update({ 
    nombre: "Alicia García", 
    edad: 29,
    actualizado_en: new Date()
  });

// Actualizar con condiciones complejas
await tablaUsuarios
  .where("edad", ">", 30)
  .where("estado", "=", "inactivo")
  .update({ estado: "archivado" });
```

### Eliminar datos

Utiliza el método `delete` para eliminar registros. **Requiere condiciones WHERE**.

```typescript
// Eliminar registro específico
await tablaUsuarios
  .where("id", "=", 2)
  .delete();

// Eliminar con condiciones
await tablaUsuarios
  .where("estado", "=", "eliminado")
  .where("fecha_creacion", "<", "2023-01-01")
  .delete();
```

## Consultas avanzadas

### Consulta con WHERE

Filtra registros utilizando el método `where` con varios operadores.

```typescript
// Comparaciones básicas
const usuariosAdultos = await tablaUsuarios.where("edad", ">", 18).get();
const coincidenciaExacta = await tablaUsuarios.where("nombre", "=", "Alicia").get();
const noIgual = await tablaUsuarios.where("estado", "!=", "eliminado").get();

// Operaciones con strings
const usuariosGmail = await tablaUsuarios.where("email", "LIKE", "%@gmail.com").get();

console.log(usuariosAdultos);
// [{ id: 1, nombre: 'Alicia', edad: 28 }, ...]
```

### Consulta con OR WHERE

Utiliza `orWhere` para añadir condiciones OR a tu consulta.

```typescript
const usuarios = await tablaUsuarios
  .where("edad", ">", 25)
  .orWhere("nombre", "=", "Alicia")
  .get();

// Condiciones OR complejas
const usuariosPremium = await tablaUsuarios
  .where("suscripcion", "=", "premium")
  .orWhere("compras_totales", ">", 1000)
  .orWhere("miembro_desde", "<", "2020-01-01")
  .get();

console.log(usuarios);
// [{ id: 1, nombre: 'Alicia', edad: 28 }, ...]
```

### Consulta con grupos de condiciones WHERE

Agrupa condiciones utilizando `whereGroup` para lógica compleja.

```typescript
// (edad > 25 OR nombre = 'Juana') AND estado = 'activo'
const usuarios = await tablaUsuarios
  .whereGroup((query) => {
    query.where("edad", ">", 25).orWhere("nombre", "=", "Juana");
  })
  .where("estado", "=", "activo")
  .get();

// Grupos anidados
const consultaCompleja = await tablaUsuarios
  .whereGroup((query) => {
    query.where("pais", "=", "ES").orWhere("pais", "=", "MX");
  })
  .where("activo", "=", true)
  .whereGroup((query) => {
    query.where("edad", ">=", 21).orWhere("verificado", "=", true);
  })
  .get();
```

### Consulta con BETWEEN

Busca valores dentro de un rango utilizando `whereBetween`.

```typescript
// Edad entre 25 y 35
const usuarios = await tablaUsuarios.whereBetween("edad", [25, 35]).get();

// Rangos de fechas
const usuariosRecientes = await tablaUsuarios
  .whereBetween("fecha_creacion", ["2024-01-01", "2024-12-31"])
  .get();

console.log(usuarios);
// [{ id: 1, nombre: 'Alicia', edad: 28 }, { id: 2, nombre: 'Roberto', edad: 32 }]
```

### Consulta con IN

Busca valores que coincidan con un conjunto de valores utilizando `whereIn`.

```typescript
// IDs específicos
const usuarios = await tablaUsuarios.whereIn("id", [1, 3, 5]).get();

// Múltiples estados
const usuariosFiltrados = await tablaUsuarios
  .whereIn("estado", ["activo", "pendiente", "verificado"])
  .get();

// Valores string
const dominiosEmail = await tablaUsuarios
  .whereIn("dominio_email", ["gmail.com", "yahoo.com", "hotmail.com"])
  .get();

console.log(usuarios);
// [{ id: 1, nombre: 'Alicia', edad: 28 }, { id: 3, nombre: 'Carlos', edad: 35 }]
```

### Consulta con IS NULL / IS NOT NULL

Busca valores nulos o no nulos utilizando `whereNull` y `whereNotNull`.

```typescript
// Usuarios sin email
const usuariosSinEmail = await tablaUsuarios.whereNull("email").get();

// Usuarios con email
const usuariosConEmail = await tablaUsuarios.whereNotNull("email").get();

// Combinar con otras condiciones
const perfilesIncompletos = await tablaUsuarios
  .whereNull("telefono")
  .orWhere("avatar", "IS NULL")
  .whereNotNull("email")
  .get();
```

### Consulta con JOIN

Une tablas utilizando el método `join` para INNER JOIN.

```typescript
// INNER JOIN básico
const usuariosConPedidos = await tablaUsuarios
  .join("pedidos", "usuarios.id", "=", "pedidos.usuario_id")
  .select(["usuarios.nombre", "pedidos.pedido_id", "pedidos.total"])
  .get();

// Múltiples JOINs
const pedidosDetallados = await tablaUsuarios
  .join("pedidos", "usuarios.id", "=", "pedidos.usuario_id")
  .join("items_pedido", "pedidos.id", "=", "items_pedido.pedido_id")
  .join("productos", "items_pedido.producto_id", "=", "productos.id")
  .select(["usuarios.nombre", "pedidos.pedido_id", "productos.nombre AS nombre_producto"])
  .get();

console.log(usuariosConPedidos);
// [{ nombre: 'Alicia', pedido_id: 101, total: 150.00 }, ...]
```

### Consulta con LEFT JOIN

Realiza un left join utilizando el método `leftJoin`.

```typescript
// Incluir usuarios aunque no tengan pedidos
const usuariosConPedidos = await tablaUsuarios
  .leftJoin("pedidos", "usuarios.id", "=", "pedidos.usuario_id")
  .select(["usuarios.nombre", "pedidos.pedido_id"])
  .get();

// Left join con agregación
const contadorPedidosUsuarios = await tablaUsuarios
  .leftJoin("pedidos", "usuarios.id", "=", "pedidos.usuario_id")
  .select(["usuarios.nombre"])
  .count("pedidos.id")
  .groupBy("usuarios.id")
  .get();

console.log(usuariosConPedidos);
// [{ nombre: 'Alicia', pedido_id: 101 }, { nombre: 'Roberto', pedido_id: null }, ...]
```

### Consulta con RIGHT JOIN

Realiza un right join utilizando el método `rightJoin`.

```typescript
// Incluir pedidos aunque falten datos del usuario
const pedidosConUsuarios = await tablaUsuarios
  .rightJoin("pedidos", "usuarios.id", "=", "pedidos.usuario_id")
  .select(["usuarios.nombre", "pedidos.pedido_id"])
  .get();

console.log(pedidosConUsuarios);
// [{ nombre: 'Alicia', pedido_id: 101 }, { nombre: null, pedido_id: 102 }, ...]
```

### Consulta con ORDER BY

Ordena resultados utilizando el método `orderBy`.

```typescript
// Ordenamiento de una columna
const usuariosOrdenados = await tablaUsuarios
  .orderBy("nombre", "ASC")
  .get();

// Ordenamiento de múltiples columnas
const ordenComplejo = await tablaUsuarios
  .orderBy("pais", "ASC")
  .orderBy("edad", "DESC")
  .orderBy("nombre", "ASC")
  .get();

// Ordenar con condiciones
const usuariosActivosRecientes = await tablaUsuarios
  .where("estado", "=", "activo")
  .orderBy("ultimo_acceso", "DESC")
  .limit(20)
  .get();

console.log(usuariosOrdenados);
// [{ id: 1, nombre: 'Alicia', ... }, { id: 2, nombre: 'Roberto', ... }]
```

### Consulta con LIMIT y OFFSET (paginación)

Limita el número de resultados e implementa paginación utilizando `limit` y `page`.

```typescript
// Límite simple
const primerosDiezUsuarios = await tablaUsuarios.limit(10).get();

// Paginación
const primeraPagina = await tablaUsuarios.limit(5).page(1).get();
const segundaPagina = await tablaUsuarios.limit(5).page(2).get();

// Paginación con ordenamiento
const usuariosPaginados = await tablaUsuarios
  .orderBy("fecha_creacion", "DESC")
  .limit(10)
  .page(3) // Omitir los primeros 20 registros (páginas 1-2)
  .get();

console.log(primeraPagina);   // Registros 1-5
console.log(segundaPagina);   // Registros 6-10
```

### Consulta con GROUP BY

Agrupa resultados utilizando el método `groupBy`.

```typescript
// Agrupamiento simple
const usuariosPorEdad = await tablaUsuarios
  .select(["edad"])
  .count("*")
  .groupBy("edad")
  .get();

// Múltiples columnas de agrupamiento
const usuariosPorPaisYEdad = await tablaUsuarios
  .select(["pais", "edad"])
  .count("*")
  .groupBy("pais")
  .groupBy("edad")
  .get();

console.log(usuariosPorEdad);
// [{ edad: 28, count: 2 }, { edad: 32, count: 1 }]
```

### Consulta con DISTINCT

Recupera registros únicos utilizando el método `distinct`.

```typescript
// Valores únicos
const paisesUnicos = await tablaUsuarios
  .distinct()
  .select(["pais"])
  .get();

// Distinct con condiciones
const paisesUsuariosActivos = await tablaUsuarios
  .distinct()
  .select(["pais"])
  .where("estado", "=", "activo")
  .get();

console.log(paisesUnicos);
// [{ pais: 'España' }, { pais: 'México' }, { pais: 'Argentina' }]
```

## Funciones de agregación

### count

Cuenta el número de registros.

```typescript
// Contar todos los registros
const totalUsuarios = await tablaUsuarios.count().first();
console.log(totalUsuarios); // { count: 150 }

// Contar columna específica
const usuariosConEmail = await tablaUsuarios.count("email").first();

// Contar con condiciones
const usuariosActivos = await tablaUsuarios
  .where("estado", "=", "activo")
  .count()
  .first();
```

### sum

Calcula la suma de una columna.

```typescript
// Suma de edades
const edadTotal = await tablaUsuarios.sum("edad").first();
console.log(edadTotal); // { sum: 4250 }

// Suma con condiciones
const ingresosPremium = await tablaUsuarios
  .join("pedidos", "usuarios.id", "=", "pedidos.usuario_id")
  .where("usuarios.suscripcion", "=", "premium")
  .sum("pedidos.total")
  .first();
```

### avg

Calcula el promedio de una columna.

```typescript
// Edad promedio
const edadPromedio = await tablaUsuarios.avg("edad").first();
console.log(edadPromedio); // { avg: 28.33 }

// Promedio con agrupamiento
const edadPromedioPorPais = await tablaUsuarios
  .select(["pais"])
  .avg("edad")
  .groupBy("pais")
  .get();
```

### max

Encuentra el valor máximo en una columna.

```typescript
// Usuario más viejo
const edadMaxima = await tablaUsuarios.max("edad").first();
console.log(edadMaxima); // { max: 65 }

// Registro más reciente
const usuarioMasReciente = await tablaUsuarios.max("fecha_creacion").first();
```

### min

Encuentra el valor mínimo en una columna.

```typescript
// Usuario más joven
const edadMinima = await tablaUsuarios.min("edad").first();
console.log(edadMinima); // { min: 18 }

// Primer registro
const primerUsuario = await tablaUsuarios.min("fecha_creacion").first();
```

## Buscar registros

### find

Encuentra un registro por un valor específico de columna (por defecto 'id').

```typescript
// Buscar por ID (por defecto)
const usuario = await tablaUsuarios.find(1);
console.log(usuario);
// { id: 1, nombre: 'Alicia', email: 'alicia@ejemplo.com', edad: 28 }

// Buscar por columna específica
const usuarioPorEmail = await tablaUsuarios.find("alicia@ejemplo.com", "email");

// Find devuelve null si no se encuentra
const noExistente = await tablaUsuarios.find(999);
console.log(noExistente); // null
```

### first

Obtiene solo el primer registro que cumple con las condiciones.

```typescript
// Primer usuario que cumple la condición
const primerUsuario = await tablaUsuarios
  .where("edad", ">", 25)
  .orderBy("fecha_creacion", "ASC")
  .first();

// Primer usuario en general
const cuentaMasAntigua = await tablaUsuarios
  .orderBy("fecha_creacion", "ASC")
  .first();

console.log(primerUsuario);
// { id: 1, nombre: 'Alicia', edad: 28, ... } o null si no hay coincidencia
```

## Campos calculados y triggers

DBCube Query Builder soporta campos calculados y triggers para procesamiento avanzado de datos.

```typescript
// Habilitar campos calculados (procesados automáticamente)
await db.useComputes();

// Habilitar triggers
await db.useTriggers();

// Los triggers y campos calculados se configuran a través de otros componentes DBCube
```

## Ejecutar consultas SQL crudas

Para consultas complejas que requieren SQL crudo, utiliza el motor subyacente.

```typescript
// Acceder al motor subyacente para consultas crudas
// (La implementación depende de tu configuración específica de DBCube core)

// Nota: Las consultas SQL crudas evitan la capa de abstracción del query builder
// y son específicas de la base de datos
```

### Manejo de errores

La biblioteca proporciona manejo comprehensivo de errores con mensajes descriptivos.

```typescript
try {
  // Esto arrojará un error - UPDATE requiere condiciones WHERE
  await tablaUsuarios.update({ nombre: "Actualizado" });
} catch (error) {
  console.error(error.message);
  // "Debes especificar al menos una condición WHERE para realizar una actualización."
}

try {
  // Esto arrojará un error - formato de datos inválido
  await tablaUsuarios.insert("datos inválidos");
} catch (error) {
  console.error(error.message);
  // "El método insert requiere un array de objetos con pares clave-valor."
}

// Los errores de conexión y base de datos también se manejan apropiadamente
try {
  const resultado = await tablaUsuarios.get();
} catch (error) {
  // Errores de conexión a base de datos o ejecución de consultas
  console.error("Error de base de datos:", error);
}
```

## API completa

### Clase Database

#### `new Database(name: string)`

Crea una nueva instancia de conexión a base de datos.

```typescript
const db = new Database("mi_base_de_datos");
```

#### `table(tableName: string): Table`

Devuelve una instancia Table para construir consultas en la tabla especificada.

```typescript
const tablaUsuarios = db.table("usuarios");
```

#### `useComputes(): Promise<void>`

Habilita el procesamiento de campos calculados para la base de datos.

```typescript
await db.useComputes();
```

#### `useTriggers(): Promise<void>`

Habilita el procesamiento de triggers para la base de datos.

```typescript
await db.useTriggers();
```

#### `connect(): Promise<void>`

Establece conexión a base de datos (manejado automáticamente).

#### `disconnect(): Promise<void>`

Cierra conexión a base de datos.

### Clase Table

Los métodos de la clase Table siguen la misma API que se documentó en la sección en inglés, con la funcionalidad idéntica.

## Soporte multi-base de datos

DBCube Query Builder funciona con múltiples motores de base de datos:

```typescript
// MySQL
const mysqlDb = new Database("base_datos_mysql");

// PostgreSQL  
const postgresDb = new Database("base_datos_postgres");

// SQLite
const sqliteDb = new Database("base_datos_sqlite");

// MongoDB
const mongoDb = new Database("base_datos_mongo");

// La misma API funciona a través de todas las bases de datos
const usuarios = await mysqlDb.table("usuarios").get();
const posts = await postgresDb.table("posts").get();
const logs = await sqliteDb.table("logs").get();
const analiticas = await mongoDb.table("analiticas").get();
```

## Características avanzadas

### Ejemplo de consulta compleja

```typescript
// Consulta de negocio compleja
const reporteMensual = await db.table("pedidos")
  .join("usuarios", "pedidos.usuario_id", "=", "usuarios.id")
  .join("items_pedido", "pedidos.id", "=", "items_pedido.pedido_id")
  .join("productos", "items_pedido.producto_id", "=", "productos.id")
  .select([
    "usuarios.pais",
    "productos.categoria"
  ])
  .sum("items_pedido.cantidad * items_pedido.precio")
  .where("pedidos.estado", "=", "completado")
  .whereBetween("pedidos.fecha_creacion", ["2024-01-01", "2024-01-31"])
  .groupBy("usuarios.pais")
  .groupBy("productos.categoria")
  .orderBy("sum", "DESC")
  .limit(10)
  .get();
```

### Encadenamiento de métodos

Todos los métodos del query builder devuelven la instancia Table, habilitando el encadenamiento fluido de métodos:

```typescript
const resultado = await db
  .table("usuarios")
  .select(["nombre", "email", "pais"])
  .where("activo", "=", true)
  .whereNotNull("email_verificado_en")
  .whereGroup((query) => {
    query.where("suscripcion", "=", "premium")
         .orWhere("pedidos_totales", ">", 10);
  })
  .join("perfiles_usuario", "usuarios.id", "=", "perfiles_usuario.usuario_id")
  .orderBy("usuarios.fecha_creacion", "DESC")
  .limit(50)
  .page(1)
  .get();
```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo LICENSE para más detalles.