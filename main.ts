import { readCSV, processCSVData, saveUploadedFile } from "./functions";
import { uploadDir, db } from ".";

export async function main(file: File) {
  const startTime = Date.now();

  let recordCounts = {
    newLicenseRequests: 0,
    accountRequests: 0,
    inspectionRequests: 0,
    newActivityRequests: 0,
    stampLicenseRequests: 0,
  };
  let failedInputs: { objectId: any; error: string; }[] = [];

  try {
    const filePath = await saveUploadedFile(file, uploadDir);
    const csvData = readCSV(filePath);
    failedInputs = processCSVData(db, csvData, recordCounts);
    console;
  } catch (error) {
    console.error("An error occurred:", error);
  }

  try {
    //  printAllTables(db);
  } catch (error) {
    console.error("An error occurred:", error);
  }
  const endTime = Date.now();
  const totalTime = endTime - startTime; // Time in milliseconds
  console.log(`Total Time: ${totalTime} ms`);
  console.log("Record Counts:", recordCounts);
  console.log("faild inputs:", failedInputs);

  return { totalTime, recordCounts ,failedInputs };

}
