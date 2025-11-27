import "dotenv/config";
import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";

const API_URL = `http://localhost:${process.env.PORT || 3001}`;

async function testUpload() {
  try {
    // Create a simple test file
    const testContent = "Test file content";
    const testFilePath = "./test-file.txt";
    fs.writeFileSync(testFilePath, testContent);

    // Create form data
    const formData = new FormData();
    formData.append("file", fs.createReadStream(testFilePath), {
      filename: "test-file.txt",
      contentType: "text/plain",
    });

    console.log(`Testing upload to ${API_URL}/upload...`);

    // Make the request
    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✓ Upload successful!");
      console.log("Response:", result);
    } else {
      console.error("✗ Upload failed!");
      console.error("Status:", response.status);
      console.error("Response:", result);
    }

    // Clean up
    fs.unlinkSync(testFilePath);
  } catch (error) {
    console.error("Error testing upload:", error.message);
  }
}

testUpload();
