import {Database} from "bun:sqlite"
import { readFileSync } from "node:fs";
import type { PathOrFileDescriptor } from 'fs';

export function createDbSchema(db: Database) {

    const dbSchemaQueries = [
        `CREATE TABLE IF NOT EXISTS Requests (
            RequestID INTEGER PRIMARY KEY,
            RequestType INTEGER,
            RequestStatus INTEGER
            )`
        ,
        `CREATE TABLE IF NOT EXISTS NewLicenseRequests (
            RequestID INTEGER PRIMARY KEY,
            CompanyName TEXT,
            LicenceType TEXT,
            IsOffice BOOLEAN,
            OfficeName TEXT,
            OfficeServiceNumber TEXT,
            RequestDate DATE,
            Activities TEXT,
            FOREIGN KEY (RequestID) REFERENCES Requests(RequestID)
        )`,
        `CREATE TABLE IF NOT EXISTS AccountRequests (
            RequestID INTEGER PRIMARY KEY,
            CompanyName TEXT,
            RequesterName TEXT,
            ApplicantName TEXT,
            UserName TEXT,
            ContactEmail TEXT,
            Permissions TEXT,
            FOREIGN KEY (RequestID) REFERENCES Requests(RequestID)
        )`,
        `CREATE TABLE IF NOT EXISTS InspectionRequests (
            RequestID INTEGER PRIMARY KEY,
            CompanyName TEXT,
            InspectionDate DATE,
            InspectionTime TIME,
            InspectionType TEXT,
            FOREIGN KEY (RequestID) REFERENCES Requests(RequestID)
    
        )`,
        `CREATE TABLE IF NOT EXISTS NewActivityRequests (
            RequestID INTEGER PRIMARY KEY,
            CompanyName TEXT,
            LicenceID TEXT,
            Activities TEXT,
            FOREIGN KEY (RequestID) REFERENCES Requests(RequestID)
        )`,
        `CREATE TABLE IF NOT EXISTS StampLicenseRequests (
            RequestID INTEGER PRIMARY KEY,
            CompanyName TEXT,
            LicenceID TEXT,
            RequestDate DATE,
            FOREIGN KEY (RequestID) REFERENCES Requests(RequestID)
        )`
    ];

    for (const query of dbSchemaQueries) {
        db.exec(query);
    }
}

export function readCSV(filePath: PathOrFileDescriptor) {

    const data = readFileSync(filePath, 'utf8');
    const normalizedData = data.replace(/\r\n/g, '\n').trim();
    const rows = normalizedData.split('\n');
    rows.shift();

    const processedData = rows.map(row => {
        const parts = row.split(',');

        let rawJsonData = parts.slice(3).join(',');

        let formattedJsonData = rawJsonData.replace(/^"|"$/g, '').replace(/""/g, '"');

        const obj = {
            RequestID: parts[0],
            RequestType: parts[1],
            RequestStatus: parts[2],
            RequestData: formattedJsonData
        };

        try {
            obj.RequestData = JSON.parse(obj.RequestData);
        } catch (error) {
            console.error(`Error parsing JSON for RequestID ${obj.RequestID}:`, error);
            obj.RequestData = "";
        }
        console.log('Processed Row:', obj);
        return obj;
    });

    return processedData;
}

export function processCSVData(db: Database, csvData) {
    csvData.forEach(row => {

        // Insert into Requests table
        insertDataIntoRequestsTable(db, row.RequestID, row.RequestType, row.RequestStatus);

        // Insert into type-specific table
        insertDataIntoTypeSpecificTable(db, row.RequestID, row.RequestType, row.RequestData);
    });
}



export function insertDataIntoRequestsTable(db: Database, requestId, requestType, requestStatus) {
    db.exec(`INSERT INTO Requests (RequestID, RequestType, RequestStatus) VALUES (?, ?, ?)`, [requestId, requestType, requestStatus]);
}
export function insertDataIntoTypeSpecificTable(db: Database, requestId, requestType, requestData) {
    const data = requestData;

    switch (requestType) {
        case "1":
            db.exec(`INSERT INTO NewLicenseRequests (RequestID, CompanyName, LicenceType, IsOffice, OfficeName, OfficeServiceNumber, RequestDate, Activities) VALUES (?,?, ?, ?, ?, ?, ?, ?)`,
                [requestId, data.CompanyName, data.LicenceType, data.IsOffice, data.OfficeName, data.OfficeServiceNumber, data.RequestDate, data.Activities]);
            break;
        case "2":
            db.exec(`INSERT INTO AccountRequests (RequestID, CompanyName, RequesterName, ApplicantName, UserName, ContactEmail, Permissions) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [requestId, data.CompanyName, data.RequesterName, data.ApplicantName, data.UserName, data.ContactEmail, JSON.stringify(data.Permissions)]);
            break;
        case "3":
            db.exec(`INSERT INTO InspectionRequests (RequestID, CompanyName, InspectionDate, InspectionTime, InspectionType) VALUES (?, ?, ?, ?, ?)`,
                [requestId, data.CompanyName, data.InspectionDate, data.InspectionTime, data.InspectionType]);
            break;
        case "4":
            db.exec(`INSERT INTO NewActivityRequests (RequestID, CompanyName, LicenceID, Activities) VALUES (?, ?, ?, ?)`,
                [requestId, data.CompanyName, data.LicenceID, JSON.stringify(data.Activities)]);
            break;
        case "5":
            db.exec(`INSERT INTO StampLicenseRequests (RequestID, CompanyName, LicenceID, RequestDate) VALUES (?, ?, ?, ?)`,
                [requestId, data.CompanyName, data.LicenceID, data.RequestDate]);
            break;
        default:
            console.log("Unknown Request Type:", requestType);
            break;
    }
}

export function printTableData(tableName: string, db: Database) {
    const query = `SELECT * FROM ${tableName}`;
    const results = db.query(query).all();

    console.log(`Data from ${tableName}:`);
    console.log(results);
}

export function printAllTables(db: Database) {
    const tables = ['Requests', 'NewLicenseRequests', 'AccountRequests', 'InspectionRequests', 'NewActivityRequests', 'StampLicenseRequests'];

    tables.forEach(tableName => {
        printTableData(tableName, db);
    });
}
