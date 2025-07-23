import path from "path";
import { FileLogger } from "@dbcube/core";

export class Trigger{
    private triggers: any[];
    private databaseName: string;
    private instance: any;

    constructor(instance:any, databaseName:string, metadata: any[]){
        this.triggers = metadata;
        this.databaseName = databaseName;
        this.instance = instance;
    }

    get(type:string){
        return this.triggers.find((tr:any)=> tr.type === type);
    }

    async execute(type: string, row:any){
        const trigger = this.triggers.find((tr:any)=> tr.type === type);
        if (trigger) {
            const logFilePath = path.resolve(
                process.cwd(),
                'dbcube',
                'logs',
                'triggers',
                this.databaseName,
                `${trigger.table_ref}_${trigger.type}.log`
            );
            
            const interceptor = FileLogger.interceptConsole(logFilePath, {
                keepOriginal: false,
                useBuffer: true
            });
            const pathFile = path.resolve(process.cwd(), 'dbcube', 'triggers', `${trigger.database_ref}_${trigger.table_ref}_${trigger.type}.js`);
            delete require.cache[require.resolve(pathFile)];
            const dataProcess = require(pathFile);
            await dataProcess({db: this.instance, oldData: row, newData: row});
            interceptor.restore(); 
            return interceptor;
        }
        return null;
    }
}