import {Database} from "bun:sqlite"
import { readFileSync } from "node:fs";
import type { PathOrFileDescriptor } from 'fs';
import { promises as fs } from "fs"; 
import {createDbSchema,readCSV, processCSVData, printAllTables,numOfRecords } from "./functions"

const db = new Database("db.sqlite");

const SamplefilePath = "./Data/Sample.csv"

const uploadDir = "./RequestsUploads"; 

// Function to save the uploaded file and return the file path
async function saveUploadedFile(file: File) {
    const filePath = `${uploadDir}/${file.name}`;
    await Bun.write(filePath, file); 
    return filePath;
}

function main(filePath: string) {
    createDbSchema(db);

    try {
        const csvData = readCSV(filePath);
        processCSVData(db, csvData);
      console 
    } catch (error) {
        console.error("An error occurred:", error);
    }
    try {
      numOfRecords(db)
        // printAllTables(db);
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

// main(SamplefilePath);


const server = Bun.serve({
    port: 4000,
    async fetch(req) {
      const url = new URL(req.url);

      // return index.html for root path
      if (url.pathname === "/")
        return new Response(Bun.file("./resources/index.html"), {
          headers: {
            "Content-Type": "text/html",
          },
        });

      if (url.pathname === '/requests-upload' && req.method === "POST") {
        const formdata = await req.formData();
        const file = formdata.get('CSV_Requests');

        if (!(file instanceof File)) {
            return new Response("No CSV file provided.", { status: 400 });
        }

        const filePath = await saveUploadedFile(file);
        await main(filePath);
        return new Response("CSV processed successfully.", {
            status: 200,
            headers: {"Content-Type": "text/plain"}
        });
    }

      return new Response("Not Found", { status: 404 });
    },
  });
  
  console.log(`Listening on http://localhost:${server.port}`);
  