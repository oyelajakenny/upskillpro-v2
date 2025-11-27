import "dotenv/config";
import {
  S3Client,
  GetBucketCorsCommand,
  GetBucketLocationCommand,
} from "@aws-sdk/client-s3";

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

async function checkBucket() {
  console.log("Checking S3 bucket configuration...");
  console.log("Bucket:", BUCKET_NAME);
  console.log("Region:", bucketRegion);
  console.log("");

  try {
    // Check bucket location
    console.log("1. Checking bucket location...");
    const locationResponse = await s3.send(
      new GetBucketLocationCommand({ Bucket: BUCKET_NAME })
    );
    console.log(
      "   Bucket location:",
      locationResponse.LocationConstraint || "us-east-1"
    );
    console.log("");

    // Check CORS configuration
    console.log("2. Checking CORS configuration...");
    try {
      const corsResponse = await s3.send(
        new GetBucketCorsCommand({ Bucket: BUCKET_NAME })
      );
      console.log("   CORS Rules:");
      corsResponse.CORSRules.forEach((rule, index) => {
        console.log(`   Rule ${index + 1}:`);
        console.log("     Allowed Methods:", rule.AllowedMethods.join(", "));
        console.log("     Allowed Origins:", rule.AllowedOrigins.join(", "));
        console.log(
          "     Allowed Headers:",
          rule.AllowedHeaders?.join(", ") || "None"
        );
      });
    } catch (corsError) {
      if (corsError.name === "NoSuchCORSConfiguration") {
        console.log("   ⚠️  No CORS configuration found!");
        console.log(
          "   You need to add CORS configuration to allow uploads from your frontend."
        );
        console.log("");
        console.log("   Recommended CORS configuration:");
        console.log(
          JSON.stringify(
            [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
                AllowedOrigins: ["*"],
                ExposeHeaders: ["ETag"],
              },
            ],
            null,
            2
          )
        );
      } else {
        throw corsError;
      }
    }

    console.log("");
    console.log("✓ Bucket check complete!");
  } catch (error) {
    console.error("✗ Error checking bucket:", error.message);
    if (error.name === "NoSuchBucket") {
      console.error(
        "   The bucket does not exist or you don't have access to it."
      );
    } else if (error.name === "AccessDenied") {
      console.error(
        "   Access denied. Check your AWS credentials and IAM permissions."
      );
    }
  }
}

checkBucket();
