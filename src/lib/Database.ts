import fs from 'fs';
import { QueryEngine, ComputedFieldProcessor, TriggerProcessor } from "@dbcube/core";
import { DatabaseRecord, DML, WhereCallback, WhereCondition } from "../@types/Database";
import { Trigger } from './Trigger';

/**
 * Main class to handle MySQL database connections and queries.
 * Implements the Singleton pattern to ensure a single instance of the connection pool.
 */
export class Database {
    private name: string;
    private engine: any;
    private computedFields: any[];
    private triggers: any[];

    constructor(name: string) {
        this.name = name;
        const engine = new QueryEngine(name);
        this.engine = engine;
        this.computedFields = [];
        this.triggers = [];
    }

    async useComputes(): Promise<Database> {
        const newDatabase = new Database(this.name); 
        const arrayComputedFields = await ComputedFieldProcessor.getComputedFields(this.name);
        newDatabase.setComputedFields(arrayComputedFields);
        return newDatabase;
    }

    async useTriggers(): Promise<Database> {
        const newDatabase = new Database(this.name); 
        const arrayTriggers = await TriggerProcessor.getTriggers(this.name);
        newDatabase.setTriggers(arrayTriggers);
        return newDatabase;
    }

    async connect(): Promise<void> {
        const response = await this.engine.run('query_engine', [
            '--action', 'connect',
        ]);
        if (response.status != 200) {
            returnFormattedError(response.status, response.message);
        }
        return response.data;
    }

    async disconnect(): Promise<void> {
        return this.engine.run('query_engine', [
            '--action', 'disconnect',
        ]);
    }

    /**
     * Creates and returns a new instance of `Table` for the specified table.
     * This method is used to start building queries for a specific table.
     * It provides a fluent interface for common database operations like select, insert, update, and delete.
     *
     * @param {string} tableName - The name of the table to query.
     * @returns {Table} - Returns a new instance of `Table` for the specified table.
     *
     * @example
     * // Select all records from a table
     * const users = await db.table('users').get();
     * 
     * // Select records with conditions
     * const activeUsers = await db.table('users')
     *     .where('status', '=', 'active')
     *     .orderBy('created_at', 'DESC')
     *     .limit(10)
     *     .get();
     * 
     * // Insert records
     * await db.table('users').insert([
     *     { name: 'John', email: 'john@example.com', age: 30 }
     * ]);
     * 
     * // Update records
     * await db.table('users')
     *     .where('id', '=', 1)
     *     .update({ status: 'inactive' });
     * 
     * // Delete records
     * await db.table('users')
     *     .where('status', '=', 'deleted')
     *     .delete();
     * 
     * // Access column management
     * const columns = await db.table('users').columns().get();
     */
    table(tableName: string): Table {
        return new Table(this, this.name, tableName, this.engine, this.computedFields, this.triggers);
    }

    private setComputedFields(computedFields: any[]){
        this.computedFields = computedFields;
    }

    private setTriggers(triggers: any[]){
        this.triggers = triggers;
    }
}

/**
 * Class to build and execute SQL queries for a specific table.
 * Supports operations like SELECT, INSERT, UPDATE, DELETE, and more.
 */
export class Table {
    private engine: any;
    private nextType: 'AND' | 'OR' = 'AND';
    private dml: DML;
    private computedFields: any[] = [];
    private trigger: any;
    private triggers: any;

    constructor(instance: any, databaseName: string, tableName: string, engine: any = null, computedFields: any[] = [], triggers: any[] = []) {
        this.engine = engine;
        this.computedFields = computedFields;
        this.triggers = triggers;
        this.trigger = new Trigger(instance, databaseName, triggers);
        this.nextType = 'AND';

        this.dml = {
            type: 'select',
            database: databaseName,
            table: tableName,
            columns: ['*'],
            distinct: false,
            joins: [],
            where: [],
            orderBy: [],
            groupBy: [],
            limit: null,
            offset: null,
            data: null,
            aggregation: null
        };
    }

    /**
     * Specifies the columns to select in a SELECT query.
     *
     * @param {string[]} fields - Array of column names to select. If empty, selects all columns.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').select(['id', 'name']).get();
     * console.log(users); // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
     */
    select(fields: string[] = []): Table {
        const clone = this.clone();
        clone.dml.type = 'select';
        clone.dml.columns = fields.length > 0 ? fields : ['*'];
        return clone;
    }

    /**
     * Adds a WHERE condition to the query.
     *
     * @param {string} column - The column to filter by.
     * @param {string} operator - The comparison operator (e.g., '=', '>', '<', 'IS NULL', 'IS NOT NULL').
     * @param {any} value - The value to compare against (optional for IS NULL/IS NOT NULL).
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').where('age', '>', 25).get();
     * const nullUsers = await db.table('users').where('email', 'IS NULL').get();
     * console.log(users); // [{ id: 1, name: 'John', age: 30 }]
     */
    where(column: string, operator: 'IS NULL' | 'IS NOT NULL'): Table;
    where(column: string, operator: '=' | '!=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE' | 'IN' | 'NOT IN' | 'BETWEEN' | 'NOT BETWEEN', value: any): Table;
    where(column: string, operator: string, value?: any): Table {
        const clone = this.clone();
        clone.dml.where.push({
            column,
            operator,
            value,
            type: clone.nextType,
            isGroup: false
        });
        clone.nextType = 'AND';
        return clone;
    }

    /**
     * Adds an OR WHERE condition to the query.
     *
     * @param {string} column - The column to filter by.
     * @param {string} operator - The comparison operator (e.g., '=', '>', '<', 'IS NULL', 'IS NOT NULL').
     * @param {any} value - The value to compare against (optional for IS NULL/IS NOT NULL).
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').where('age', '>', 25).orWhere('name', '=', 'Jane').get();
     * const nullUsers = await db.table('users').where('active', '=', true).orWhere('email', 'IS NULL').get();
     * console.log(users); // [{ id: 1, name: 'John', age: 30 }, { id: 2, name: 'Jane', age: 25 }]
     */
    orWhere(column: string, operator: 'IS NULL' | 'IS NOT NULL'): Table;
    orWhere(column: string, operator: '=' | '!=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE' | 'IN' | 'NOT IN' | 'BETWEEN' | 'NOT BETWEEN', value: any): Table;
    orWhere(column: string, operator: string, value?: any): Table {
        const clone = this.clone();
        clone.dml.where.push({
            column,
            operator,
            value,
            type: 'OR',
            isGroup: false
        });
        return clone;
    }

    /**
     * Adds a grouped WHERE condition to the query.
     *
     * @param {WhereCallback} callback - A callback function that receives a new Table instance to build the grouped conditions.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').whereGroup(query => {
     *     query.where('age', '>', 25).orWhere('name', '=', 'Jane');
     * }).get();
     * console.log(users); // [{ id: 1, name: 'John', age: 30 }, { id: 2, name: 'Jane', age: 25 }]
     */
    whereGroup(callback: WhereCallback): Table {
        const clone = this.clone();
        const groupQuery = new Table(this, clone.dml.database, clone.dml.table, clone.engine);
        callback(groupQuery);

        clone.dml.where.push({
            type: clone.nextType,
            isGroup: true,
            conditions: groupQuery.dml.where as WhereCondition[]
        });
        clone.nextType = 'AND';
        return clone;
    }

    or(): Table {
        const clone = this.clone();
        clone.nextType = 'OR';
        return clone;
    }

    and(): Table {
        const clone = this.clone();
        clone.nextType = 'AND';
        return clone;
    }

    /**
     * Adds a WHERE BETWEEN condition to the query.
     *
     * @param {string} column - The column to filter by.
     * @param {[any, any]} values - A tuple with two values representing the range.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').whereBetween('age', [20, 30]).get();
     * console.log(users); // [{ id: 1, name: 'John', age: 30 }, { id: 2, name: 'Jane', age: 25 }]
     */
    whereBetween(column: string, values: [any, any]): Table {
        const clone = this.clone();
        const [value1, value2] = values;
        if (value1 !== undefined && value2 !== undefined) {
            clone.dml.where.push({
                column,
                operator: 'BETWEEN',
                value: [value1, value2],
                type: clone.nextType,
                isGroup: false
            });
            clone.nextType = 'AND';
        }
        return clone;
    }

    /**
     * Adds a WHERE IN condition to the query.
     *
     * @param {string} column - The column to filter by.
     * @param {any[]} values - An array of values to match.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').whereIn('id', [1, 2]).get();
     * console.log(users); // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
     */
    whereIn(column: string, values: any[]): Table {
        const clone = this.clone();
        if (Array.isArray(values) && values.length > 0) {
            clone.dml.where.push({
                column,
                operator: 'IN',
                value: values,
                type: clone.nextType,
                isGroup: false
            });
            clone.nextType = 'AND';
        }
        return clone;
    }

    /**
    * Adds a WHERE IS NULL condition to the query.
    *
    * @param {string} column - The column to filter by.
    * @returns {Table} - Returns the current instance of Table for method chaining.
    *
    * @example
    * const users = await db.table('users').whereNull('email').get();
    * console.log(users); // [{ id: 3, name: 'Alice', email: null }]
    */
    whereNull(column: string): Table {
        const clone = this.clone();
        clone.dml.where.push({
            column,
            operator: 'IS NULL',
            type: clone.nextType,
            isGroup: false
        });
        clone.nextType = 'AND';
        return clone;
    }

    /**
     * Adds a WHERE IS NOT NULL condition to the query.
     *
     * @param {string} column - The column to filter by.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').whereNotNull('email').get();
     * console.log(users); // [{ id: 1, name: 'John', email: 'john@example.com' }]
     */
    whereNotNull(column: string): Table {
        const clone = this.clone();
        clone.dml.where.push({
            column,
            operator: 'IS NOT NULL',
            type: clone.nextType,
            isGroup: false
        });
        clone.nextType = 'AND';
        return clone;
    }

    /**
     * Adds a JOIN clause to the query.
     *
     * @param {string} table - The table to join.
     * @param {string} column1 - The column from the current table.
     * @param {string} operator - The comparison operator (e.g., '=', '>', '<').
     * @param {string} column2 - The column from the joined table.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').join('orders', 'users.id', '=', 'orders.user_id').get();
     * console.log(users); // [{ id: 1, name: 'John', order_id: 101 }]
     */
    join(table: string, column1: string, operator: string, column2: string): Table {
        const clone = this.clone();
        clone.dml.joins.push({
            type: 'INNER',
            table,
            on: {
                column1,
                operator,
                column2
            }
        });
        return clone;
    }

    /**
     * Adds a LEFT JOIN clause to the query.
     *
     * @param {string} table - The table to join.
     * @param {string} column1 - The column from the current table.
     * @param {string} operator - The comparison operator (e.g., '=', '>', '<').
     * @param {string} column2 - The column from the joined table.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').leftJoin('orders', 'users.id', '=', 'orders.user_id').get();
     * console.log(users); // [{ id: 1, name: 'John', order_id: 101 }, { id: 2, name: 'Jane', order_id: null }]
     */
    leftJoin(table: string, column1: string, operator: string, column2: string): Table {
        const clone = this.clone();
        clone.dml.joins.push({
            type: 'LEFT',
            table,
            on: {
                column1,
                operator,
                column2
            }
        });
        return clone;
    }

    /**
     * Adds a RIGHT JOIN clause to the query.
     *
     * @param {string} table - The table to join.
     * @param {string} column1 - The column from the current table.
     * @param {string} operator - The comparison operator (e.g., '=', '>', '<').
     * @param {string} column2 - The column from the joined table.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').rightJoin('orders', 'users.id', '=', 'orders.user_id').get();
     * console.log(users); // [{ id: 1, name: 'John', order_id: 101 }, { id: null, name: null, order_id: 102 }]
     */
    rightJoin(table: string, column1: string, operator: string, column2: string): Table {
        const clone = this.clone();
        clone.dml.joins.push({
            type: 'RIGHT',
            table,
            on: {
                column1,
                operator,
                column2
            }
        });
        return clone;
    }

    /**
     * Adds an ORDER BY clause to the query.
     *
     * @param {string} column - The column to order by.
     * @param {'ASC' | 'DESC'} direction - The sorting direction ('ASC' or 'DESC').
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').orderBy('name', 'ASC').get();
     * console.log(users); // [{ id: 2, name: 'Jane' }, { id: 1, name: 'John' }]
     */
    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): Table {
        const clone = this.clone();
        const validDirections: ('ASC' | 'DESC')[] = ['ASC', 'DESC'];
        if (validDirections.includes(direction.toUpperCase() as 'ASC' | 'DESC')) {
            clone.dml.orderBy.push({
                column,
                direction: direction.toUpperCase() as 'ASC' | 'DESC'
            });
        } else {
            throw new Error(`Invalid direction: ${direction}. Use 'ASC' or 'DESC'.`);
        }
        return clone;
    }

    /**
     * Adds a GROUP BY clause to the query.
     *
     * @param {string} column - The column to group by.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').groupBy('age').get();
     * console.log(users); // [{ age: 30, count: 1 }, { age: 25, count: 1 }]
     */
    groupBy(column: string): Table {
        const clone = this.clone();
        clone.dml.groupBy.push(column);
        return clone;
    }

    /**
     * Adds a DISTINCT clause to the query.
     *
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').distinct().select(['name']).get();
     * console.log(users); // [{ name: 'John' }, { name: 'Jane' }]
     */
    distinct(): Table {
        const clone = this.clone();
        clone.dml.distinct = true;
        return clone;
    }

    /**
     * Adds a COUNT clause to the query.
     *
     * @param {string} column - The column to count (default is '*').
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const count = await db.table('users').count().first();
     * console.log(count); // { count: 2 }
     */
    async count(column: string = '*'): Promise<Number> {
        const clone = this.clone();
        clone.dml.type = 'select';
        clone.dml.aggregation = {
            type: 'COUNT',
            column,
            alias: 'count'
        }
        clone.dml.columns = [`COUNT(${column}) AS count`];
        clone.dml.data = null;
        clone.dml.limit = 1;
        try {
            const result = await clone.getResponse();
            const res = result[0] || null;
            if (res) {
                return res.count;
            }
            return 0;
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * Adds a SUM clause to the query.
     *
     * @param {string} column - The column to sum.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const totalAge = await db.table('users').sum('age').first();
     * console.log(totalAge); // { sum: 55 }
     */
    async sum(column: string): Promise<Number> {
        const clone = this.clone();
        clone.dml.type = 'select';
        clone.dml.aggregation = {
            type: 'SUM',
            column,
            alias: 'sum'
        }
        clone.dml.columns = [`SUM(${column}) AS sum`];
        clone.dml.data = null;
        clone.dml.limit = 1;
        try {
            const result = await clone.getResponse();
            const res = result[0] || null;
            if (res) {
                return res.sum;
            }
            return 0;
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * Adds an AVG clause to the query.
     *
     * @param {string} column - The column to calculate the average.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const avgAge = await db.table('users').avg('age').first();
     * console.log(avgAge); // { avg: 27.5 }
     */
    async avg(column: string): Promise<Number> {
        const clone = this.clone();
        clone.dml.type = 'select';
        clone.dml.aggregation = {
            type: 'AVG',
            column,
            alias: 'avg'
        }
        clone.dml.columns = [`AVG(${column}) AS avg`];
        clone.dml.data = null;
        clone.dml.limit = 1;
        try {
            const result = await clone.getResponse();
            const res = result[0] || null;
            if (res) {
                return res.avg;
            }
            return 0;
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * Adds a MAX clause to the query.
     *
     * @param {string} column - The column to find the maximum value.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const maxAge = await db.table('users').max('age').first();
     * console.log(maxAge); // { max: 30 }
     */
    async max(column: string): Promise<Number> {
        const clone = this.clone();
        clone.dml.type = 'select';
        clone.dml.aggregation = {
            type: 'MAX',
            column,
            alias: 'max'
        }
        clone.dml.columns = [`MAX(${column}) AS max`];
        clone.dml.data = null;
        clone.dml.limit = 1;
        try {
            const result = await clone.getResponse();
            const res = result[0] || null;
            if (res) {
                return res.max;
            }
            return 0;
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * Adds a MIN clause to the query.
     *
     * @param {string} column - The column to find the minimum value.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const minAge = await db.table('users').min('age').first();
     * console.log(minAge); // { min: 25 }
     */
    async min(column: string): Promise<Number> {
        const clone = this.clone();
        clone.dml.type = 'select';
        clone.dml.aggregation = {
            type: 'MIN',
            column,
            alias: 'min'
        }
        clone.dml.columns = [`MIN(${column}) AS min`];
        clone.dml.data = null;
        clone.dml.limit = 1;
        try {
            const result = await clone.getResponse();
            const res = result[0] || null;
            if (res) {
                return res.min;
            }
            return 0;
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * Adds a LIMIT clause to the query.
     *
     * @param {number} number - The maximum number of rows to return.
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').limit(1).get();
     * console.log(users); // [{ id: 1, name: 'John', age: 30 }]
     */
    limit(number: number): Table {
        const clone = this.clone();
        clone.dml.limit = number;
        return clone;
    }

    /**
     * Adds pagination to the query using LIMIT and OFFSET.
     *
     * @param {number} number - The page number (starting from 1).
     * @returns {Table} - Returns the current instance of Table for method chaining.
     *
     * @example
     * const users = await db.table('users').limit(1).page(2).get();
     * console.log(users); // [{ id: 2, name: 'Jane', age: 25 }]
     */
    page(number: number): Table {
        const clone = this.clone();
        if (clone.dml.limit) {
            clone.dml.offset = (number - 1) * clone.dml.limit;
        }
        return clone;
    }

    /**
    * Executes the query and returns all matching rows.
    *
    * @returns {Promise<DatabaseRecord[]>} - Returns an array of rows.
    *
    * @example
    * const users = await db.table('users').get();
    * console.log(users); // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
    */
    async get(): Promise<DatabaseRecord[]> {
        try {
            const clone = this.clone();
            clone.dml.type = 'select';
            clone.dml.data = null;
            const result = await clone.getResponse();
            return result;
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * Executes the query and returns the first matching row.
     *
     * @returns {Promise<DatabaseRecord | null>} - Returns the first row or null if no rows match.
     *
     * @example
     * const user = await db.table('users').first();
     * console.log(user); // { id: 1, name: 'John' }
     */
    async first(): Promise<DatabaseRecord | null> {
        const clone = this.clone();
        clone.dml.type = 'select';
        clone.dml.data = null;
        clone.dml.limit = 1;
        try {
            const result = await clone.getResponse();
            return result[0] || null;
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * Finds a row by a specific column value.
     *
     * @param {any} value - The value to search for.
     * @param {string} column - The column to search in (default is 'id').
     * @returns {Promise<DatabaseRecord | null>} - Returns the first matching row or null if no rows match.
     *
     * @example
     * const user = await db.table('users').find(1);
     * console.log(user); // { id: 1, name: 'John' }
     */
    async find(value: any, column: string = 'id'): Promise<DatabaseRecord | null> {
        const clone = this.clone();
        clone.dml.type = 'select';
        clone.dml.data = null;
        clone.where(column, '=', value);
        clone.dml.limit = 1;
        try {
            const result = await clone.getResponse();
            return result[0] || null;
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * Inserts one or more rows into the table.
     *
     * @param {DatabaseRecord[]} data - An array of objects representing the rows to insert.
     * @returns {Promise<DatabaseRecord[]>} - Returns an array of the inserted rows.
     *
     * @example
     * const newUsers = await db.table('users').insert([
     *     { name: 'Alice', age: 28 },
     *     { name: 'Bob', age: 32 }
     * ]);
     * console.log(newUsers); // [{ id: 3, name: 'Alice', age: 28 }, { id: 4, name: 'Bob', age: 32 }]
     */
    async insert(data: DatabaseRecord[]): Promise<DatabaseRecord[]> {
        const clone = this.clone();
        if (!Array.isArray(data)) {
            throw new Error('The insert method requires an array of objects with key-value pairs.');
        }

        if (!data.every(item => typeof item === 'object' && item !== null)) {
            throw new Error('The array must contain only valid objects.');
        }

        clone.dml.type = 'insert';
        clone.dml.data = data;

        await clone.getResponse(clone.dml, 'Add');

        return data;
    }

    /**
     * Updates rows in the table based on the defined conditions.
     *
     * @param {DatabaseRecord} data - An object with key-value pairs representing the fields to update.
     * @returns {Promise<any>} - Returns the result of the update operation.
     *
     * @example
     * const result = await db.table('users')
     *     .where('id', '=', 1)
     *     .update({ name: 'John Updated', age: 31 });
     * console.log(result); // { affectedRows: 1 }
     */
    async update(data: DatabaseRecord): Promise<any> {
        const clone = this.clone();
        if (typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('The update method requires an object with key-value pairs.');
        }

        if (clone.dml.where.length === 0) {
            throw new Error('You must specify at least one WHERE condition to perform an update.');
        }

        clone.dml.type = 'update';
        clone.dml.data = data;

        await clone.getResponse(clone.dml, 'Update');

        return data;
    }

    /**
     * Deletes rows from the table based on the defined conditions.
     *
     * @returns {Promise<any>} - Returns the result of the delete operation.
     *
     * @example
     * const result = await db.table('users').where('id', '=', 1).delete();
     * console.log(result); // { affectedRows: 1 }
     */
    async delete(): Promise<any> {
        const clone = this.clone();
        if (clone.dml.where.length === 0) {
            throw new Error('You must specify at least one WHERE condition to perform a delete.');
        }

        clone.dml.type = 'delete';

        const deleteData = await clone.getResponse(clone.dml, 'Delete');
        return deleteData;
    }

    private async getResponse(dml: any = null, type: any = null): Promise<any> {
        const localDML = dml ? dml : this.dml;
        const computedFieldsNeeded: any[] = [];
        let dependeciesArrray: any[] = [];

        if (this.computedFields.length > 0) {
            let columns = localDML.columns;

            for (const field of localDML.columns) {
                const computedField = this.computedFields.find(cf => cf.column === field);

                if (computedField) {
                    computedFieldsNeeded.push(computedField);
                    // Add dependencies to real fields
                    const dependencies = ComputedFieldProcessor.extractDependencies(computedField.instruction);
                    dependeciesArrray = [...dependeciesArrray, ...dependencies];
                    columns = Array.from(new Set([...columns, ...dependencies]));
                    columns = columns.filter((col: string) => col != field);
                }
            }
            localDML.columns = columns;
        }

        let arrayResult = [];
        if (type) {
            const beffore = this.trigger.get('before' + type);
            const after = this.trigger.get('after' + type);
            if (this.triggers.length > 0 && (beffore || after)) {
                const dataset = localDML.data;
                for (let index = 0; index < dataset.length; index++) {
                    const data = dataset[index];
                    const newDML = { ...localDML, data: [data] };
                    if (beffore) {
                        const interceptor = await this.trigger.execute('before' + type, data);
                        const response = await this.engine.run('query_engine', [
                            '--action', 'execute',
                            '--dml', JSON.stringify(newDML)
                        ]);

                        if (response.status != 200) {
                            interceptor.discard();
                            returnFormattedError(response.status, response.message);
                        }
                        await interceptor.commit();
                        arrayResult = response.data;
                    }
                    if (after) {

                        const response = await this.engine.run('query_engine', [
                            '--action', 'execute',
                            '--dml', JSON.stringify(newDML)
                        ]);

                        if (response.status != 200) {
                            returnFormattedError(response.status, response.message);
                        }
                        const interceptor = await this.trigger.execute('after' + type, data);
                        await interceptor.commit();
                    }
                }
            } else {
                const response = await this.engine.run('query_engine', [
                    '--action', 'execute',
                    '--dml', JSON.stringify(localDML)
                ]);

                if (response.status != 200) {
                    returnFormattedError(response.status, response.message);
                }

                arrayResult = response.data;
            }
        } else {
            const response = await this.engine.run('query_engine', [
                '--action', 'execute',
                '--dml', JSON.stringify(localDML)
            ]);

            if (response.status != 200) {
                returnFormattedError(response.status, response.message);
            }

            arrayResult = response.data;
        }

        if (computedFieldsNeeded.length > 0) {
            let newDataset: any = ComputedFieldProcessor.computedFields(arrayResult, computedFieldsNeeded);
            const result = newDataset.map((obj: any) => {
                const newObj = { ...obj };
                dependeciesArrray.forEach(key => delete newObj[key]);
                return newObj;
            });
            return result;
        }
        return arrayResult;
    }

    private clone(): Table {
        const cloned = Object.create(Object.getPrototypeOf(this));
        cloned.engine = this.engine;
        cloned.nextType = this.nextType;
        cloned.computedFields = this.computedFields;
        cloned.trigger = this.trigger;
        cloned.triggers = this.triggers;
        cloned.dml = {
            ...this.dml,
            columns: [...this.dml.columns],
            joins: [...this.dml.joins],
            where: [...this.dml.where],
            orderBy: [...this.dml.orderBy],
            groupBy: [...this.dml.groupBy]
        };
        return cloned;
    }

}

function returnFormattedError(status: number, message: string) {
    const RESET = '\x1b[0m';
    const RED = '\x1b[31m';
    const YELLOW = '\x1b[33m';
    const BOLD = '\x1b[1m';
    const CYAN = '\x1b[36m';
    const GRAY = '\x1b[90m';
    const UNDERLINE = '\x1b[4m';
    const MAGENTA = '\x1b[35m';

    let output = '';
    let help = '';
    const color = status === 600 ? YELLOW : RED;


    if (message.includes("[help]")) {
        const parts = message.split("[help]");
        output += `\n${RED}${BOLD}${parts[0]}${RESET}`;
        help += `\n${MAGENTA}${BOLD}[help]${RESET} ${GRAY}${parts[1]}${RESET}\n`;
    } else {
        output += `\n${color}${BOLD}${message}${RESET}\n`;
    }

    const err = new Error();
    const stackLines = err.stack?.split('\n') || [];

    // Buscamos la primera línea del stack fuera de node_modules
    const relevantStackLine = stackLines.find(line =>
        line.includes('.js:') && !line.includes('node_modules')
    );

    if (relevantStackLine) {
        const match = relevantStackLine.match(/\((.*):(\d+):(\d+)\)/) ||
            relevantStackLine.match(/at (.*):(\d+):(\d+)/);

        if (match) {
            const [, filePath, lineStr, columnStr] = match;
            const lineNum = parseInt(lineStr, 10);
            const errorLocation = `${filePath}:${lineStr}:${columnStr}`;

            // Leemos el archivo y sacamos las líneas relevantes
            try {
                const codeLines = fs.readFileSync(filePath, 'utf-8').split('\n');
                const start = Math.max(0, lineNum - 3);
                const end = Math.min(codeLines.length, lineNum + 2);

                output += `\n${CYAN}${BOLD}[code] ${RESET}${YELLOW} ${UNDERLINE}${errorLocation}${RESET}\n`;

                for (let i = start; i < end; i++) {
                    const line = codeLines[i];
                    const lineLabel = `${i + 1}`.padStart(4, ' ');
                    const pointer = i + 1 === lineNum ? `${RED}<-${RESET}` : '  ';
                    output += `${GRAY}${lineLabel}${RESET} ${pointer} ${line}\n`;
                }
            } catch (err) {
                output += `${YELLOW}⚠️ No se pudo leer el archivo de origen: ${filePath}${RESET}\n`;
                output += `\n${CYAN}${BOLD}Stack Trace:${RESET}\n${stackLines.slice(2).join('\n')}\n`;
            }
        }
    }
    output += help;
    console.error(output);
}

export default Database;
