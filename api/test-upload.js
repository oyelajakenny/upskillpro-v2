import "dotenv/config";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

console.log("Testing S3 connection...");
console.log("Region:", process.env.AWS_REGION);
console.log("Bucket:", process.env.AWS_BUCKET_NAME);

try {
  const response = await s3.send(new ListBucketsCommand({}));
  console.log("\nAvailable buckets:");
  response.Buckets.forEach((bucket) => {
    console.log(`- ${bucket.Name}`);
  });
} catch (error) {
  console.error("\nError connecting to S3:", error.message);
}
