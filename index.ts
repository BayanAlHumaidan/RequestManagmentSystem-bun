import {Database} from "bun:sqlite"
import { readFileSync } from "node:fs";
import type { PathOrFileDescriptor } from 'fs';

import {createDbSchema,readCSV, processCSVData, printAllTables } from "./functions"

const db = new Database("db.sqlite");

const SamplefilePath = "./Data/Sample.csv"



function main(filePath) {
    createDbSchema(db);
    try {
        const csvData = readCSV( filePath);

        processCSVData(db, csvData);

    } catch (error) {
        console.error("An error occurred:", error);
    }

    try {
        printAllTables(db);
    } catch (error) {
        console.error("An error occurred:", error);
    }

}

main(SamplefilePath);


