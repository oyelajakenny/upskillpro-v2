import "dotenv/config";
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const bucketRegion = process.env.AWS_S3_BASE_URL?.includes("eu-north-1")
  ? "eu-north-1"
  : process.env.AWS_REGION;

const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

async function addCorsConfiguration() {
  console.log("Adding CORS configuration to S3 bucket...");
  console.log("Bucket:", BUCKET_NAME);
  console.log("Region:", bucketRegion);
  console.log("");

  const corsConfiguration = {
    CORSRules: [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
        AllowedOrigins: ["*"], // In production, replace with your specific domain
        ExposeHeaders: [
          "ETag",
          "x-amz-server-side-encryption",
          "x-amz-request-id",
        ],
        MaxAgeSeconds: 3000,
      },
    ],
  };

  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: BUCKET_NAME,
        CORSConfiguration: corsConfiguration,
      })
    );

    console.log("✓ CORS configuration added successfully!");
    console.log("");
    console.log("Configuration:");
    console.log(JSON.stringify(corsConfiguration, null, 2));
    console.log("");
    console.log(
      "Note: In production, you should restrict AllowedOrigins to your specific domain(s)."
    );
  } catch (error) {
    console.error("✗ Error adding CORS configuration:", error.message);
    if (error.name === "AccessDenied") {
      console.error(
        "   Your AWS credentials don't have permission to modify bucket CORS."
      );
      console.error("   Required permission: s3:PutBucketCORS");
    }
  }
}

addCorsConfiguration();
