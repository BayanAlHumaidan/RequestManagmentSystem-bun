import { Database } from "bun:sqlite"
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

export function numOfRecords(db: Database) {
    const tables = ['Requests', 'NewLicenseRequests', 'AccountRequests', 'InspectionRequests', 'NewActivityRequests', 'StampLicenseRequests'];

    tables.forEach(tableName => {
        const result = db.exec(`SELECT COUNT(*) FROM ${tableName}`)
        console.log(`${tableName}: ${result}`)
    })
}

export function processCSVData(db: Database, csvData) {
    csvData.forEach(row => {
        try {
            // Insert into Requests table
            insertDataIntoRequestsTable(db, row.RequestID, row.RequestType, row.RequestStatus);

            // Insert into type-specific table
            insertDataIntoTypeSpecificTable(db, row.RequestID, row.RequestType, row.RequestData);
        } catch (e) {
            console.error(`Failed to process row with RequestID ${row.RequestID}: ${e.message}`);
        }
    });
}
export function readCSV(filePath: PathOrFileDescriptor) {
    try {
        const data = readFileSync(filePath, 'utf8');
        const normalizedData = data.replace(/\r\n/g, '\n').trim();
        const rows = normalizedData.split('\n');
        rows.shift();

        const processedData = rows.map(processRow);
        return processedData;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to read or process CSV file: ${error.message}`);
        } else {
            console.error(`Failed to read or process CSV file: An unknown error occurred`);
        }

        return []; // Return an empty array 
    }
}

function processRow(row) {
    const parts = row.split(',');
    let rawJsonData = parts.slice(3).join(',');
    let formattedJsonData = rawJsonData.replace(/^"|"$/g, '').replace(/""/g, '"');

    const obj = {
        RequestID: parseInt(parts[0], 10),
        RequestType: parseInt(parts[1], 10),
        RequestStatus: parseInt(parts[2], 10),
        RequestData: formattedJsonData
    };

    try {
        obj.RequestData = JSON.parse(obj.RequestData);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error parsing JSON for RequestID ${obj.RequestID}: ${error.message}`);
        } else {
            console.error(`Error parsing JSON for RequestID An unknown error occurred`);
        }

        obj.RequestData = "";
    }
    return obj;
}

function insertDataIntoRequestsTable(db: Database, requestId, requestType, requestStatus) {
    try {
        db.exec(`INSERT INTO Requests (RequestID, RequestType, RequestStatus) VALUES (?, ?, ?)`, [requestId, requestType, requestStatus]);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to insert into Requests: ${error.message}`);
        } else {
            console.error(`Failed to insert into Requests: An unknown error occurred`);
        }
    }
}
function insertDataIntoTypeSpecificTable(db: Database, requestId, requestType, requestData) {
    const data = requestData;

    try {
        switch (requestType) {
            case 1:
                db.exec(`INSERT INTO NewLicenseRequests (RequestID, CompanyName, LicenceType, IsOffice, OfficeName, OfficeServiceNumber, RequestDate, Activities) VALUES (?,?, ?, ?, ?, ?, ?, ?)`,
                    [requestId, data.CompanyName, data.LicenceType, data.IsOffice, data.OfficeName, data.OfficeServiceNumber, data.RequestDate, data.Activities]);
                break;
            case 2:
                db.exec(`INSERT INTO AccountRequests (RequestID, CompanyName, RequesterName, ApplicantName, UserName, ContactEmail, Permissions) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [requestId, data.CompanyName, data.RequesterName, data.ApplicantName, data.UserName, data.ContactEmail, JSON.stringify(data.Permissions)]);
                break;
            case 3:
                db.exec(`INSERT INTO InspectionRequests (RequestID, CompanyName, InspectionDate, InspectionTime, InspectionType) VALUES (?, ?, ?, ?, ?)`,
                    [requestId, data.CompanyName, data.InspectionDate, data.InspectionTime, data.InspectionType]);
                break;
            case 4:
                db.exec(`INSERT INTO NewActivityRequests (RequestID, CompanyName, LicenceID, Activities) VALUES (?, ?, ?, ?)`,
                    [requestId, data.CompanyName, data.LicenceID, JSON.stringify(data.Activities)]);
                break;
            case 5:
                db.exec(`INSERT INTO StampLicenseRequests (RequestID, CompanyName, LicenceID, RequestDate) VALUES (?, ?, ?, ?)`,
                    [requestId, data.CompanyName, data.LicenceID, data.RequestDate]);
                break;
            default:
                console.log("Unknown Request Type:", requestType);
                break;
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to insert into Request specific table: ${error.message}`);
        } else {
            console.error(`Failed to insert into Request specific table: An unknown error occurred`);
        }

    }
}

function printTableData(tableName: string, db: Database) {
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
