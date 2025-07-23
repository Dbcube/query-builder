import { Table } from "../lib/Database";
import { ChildProcess } from 'child_process';

export interface JoinCondition {
    column1: string;
    operator: string;
    column2: string;
}

export interface Join {
    type: 'INNER' | 'LEFT' | 'RIGHT';
    table: string;
    on: JoinCondition;
}

export interface WhereCondition {
    column: string;
    operator: string;
    value?: any;
    type: 'AND' | 'OR';
    isGroup: boolean;
}

export interface GroupedWhereCondition {
    type: 'AND' | 'OR';
    isGroup: true;
    conditions: WhereCondition[];
}

export interface OrderBy {
    column: string;
    direction: 'ASC' | 'DESC';
}

export interface Aggregation {
    type: 'COUNT' | 'SUM' | 'AVG' | 'MAX' | 'MIN';
    column: string;
    alias: string;
}

export interface DML {
    type: 'select' | 'insert' | 'update' | 'delete';
    database: string;
    table: string;
    columns: string[];
    requestedFields?: string[];
    computedFieldsNeeded?: any[];  
    distinct: boolean;
    joins: Join[];
    where: (WhereCondition | GroupedWhereCondition)[];
    orderBy: OrderBy[];
    groupBy: string[];
    limit: number | null;
    offset: number | null;
    data: any[] | Record<string, any> | null;
    aggregation: Aggregation | null;
}
export interface ConnectionResult {
    code: number;
    stdout: string;
    stderr: string;
}

export interface DatabasePool {
    process: ChildProcess;
    connected: boolean;
    connectionTime: Date;
    queries: number;
}

export type WhereCallback = (query: Table) => void;
export type DatabaseRecord = Record<string, any>;