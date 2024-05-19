import { Database } from "bun:sqlite"

import { createDbSchema, printAllTables } from "./functions"
import { main } from "./main";
import { parse } from "csv-parse/sync";
export const db = new Database("db.sqlite");

// const SamplefilePath = "./Data/Sample.csv"
// // main(SamplefilePath);

export const uploadDir = "./RequestsUploads";


createDbSchema(db);



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

      const summary = await main(file);

      return new Response(
        JSON.stringify(summary), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
