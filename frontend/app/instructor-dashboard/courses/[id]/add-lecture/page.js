"use client";
import Button from "@mui/material/Button";
import { Card, CardContent } from "@/components/ui/card";
import React, { useState } from "react";
import { Upload } from "@mui/icons-material";
import { toast } from "react-toastify";
import { handleFileUpload } from "@/utils/handleFileUpload";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  TextField,
  Typography,
  Stack,
  Box,
} from "@mui/material";

const CreateLecture = ({ params }) => {
  const { id } = React.use(params);
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [videoPreview, setVideoPreview] = useState(null);
  const router = useRouter();

  const MAX_FILE_SIZE_MB = 100;

  const handleVideoChange = (event) => {
    try {
      const selectedVideo = event.target.files[0];

      if (!selectedVideo) {
        setErrors((prev) => ({ ...prev, video: "No file selected" }));
        return;
      }

      const fileSizeMB = selectedVideo.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        setErrors((prev) => ({
          ...prev,
          video: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
        }));
        setVideoPreview(null);
        setVideo(null);
        event.target.value = "";
        return;
      }

      if (videoPreview) URL.revokeObjectURL(videoPreview);

      setVideo(selectedVideo);
      setVideoPreview(URL.createObjectURL(selectedVideo));
      setErrors((prev) => ({ ...prev, video: null }));
    } catch (error) {
      console.error("Error handling video upload:", error);
      setErrors((prev) => ({
        ...prev,
        video: "An unexpected error occurred. Please try again.",
      }));
    }
  };

  const checkForErrors = () => {
    const errors = {};
    if (!title.trim()) errors.title = "Please provide a valid title";
    if (!video) errors.video = "Please upload a video";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const errorFields = checkForErrors();
    if (Object.keys(errorFields).length > 0) {
      setErrors(errorFields);
      setIsLoading(false);
      return;
    }

    try {
      const videoUrl = await handleFileUpload(video);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${id}/lectures`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, videoUrl }),
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Lecture created successfully! 🎉");
        setTitle("");
        setVideo(null);
        setVideoPreview(null);
        router.push("/instructor-dashboard");
      } else {
        const { message } = await response.json();
        console.error("Error:", message);
      }
    } catch (error) {
      console.error("Error creating lecture:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 10, mb: 8 }}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography
          variant="h4"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: { xs: "1.4rem", sm: "1.8rem" },
            color: "#1a202c",
          }}
        >
          Create a New Lecture
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: { xs: "1rem", sm: "1.2rem" },
            color: "#4a5568",
          }}
        >
          Fill in the details below to create your lecture.
        </Typography>
      </Stack>

      {/* Form Container */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Paper
          elevation={4}
          sx={{
            width: "100%",
            maxWidth: 600,
            p: 4,
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Lecture Title"
              value={title}
              margin="normal"
              size="medium"
              onChange={(e) => setTitle(e.target.value)}
              required
              sx={{
                borderRadius: "8px",
                "& input": {
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                },
              }}
            />
            {errors.title && (
              <Typography color="error">{errors.title}</Typography>
            )}

            {/* Video Preview */}
            {videoPreview && (
              <Box sx={{ textAlign: "center", mt: 2 }}>
                <video
                  src={videoPreview}
                  controls
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    borderRadius: "8px",
                  }}
                />
              </Box>
            )}

            {/* Video Upload Button */}
            <Stack spacing={2} alignItems="center" mt={2}>
              <label htmlFor="video-upload">
                <Button
                  variant="contained"
                  component="span"
                  sx={{ bgcolor: "#333", "&:hover": { bgcolor: "#555" } }}
                >
                  <Upload sx={{ mr: 1 }} />
                  Upload Video
                </Button>
              </label>
              <input
                type="file"
                id="video-upload"
                hidden
                accept="video/*"
                onChange={handleVideoChange}
              />
              {errors.video && (
                <Typography color="error">{errors.video}</Typography>
              )}
            </Stack>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                mt: 3,
                bgcolor: "#333",
                color: "#fff",
                fontSize: { xs: "0.9rem", sm: "1rem" },
                "&:hover": { bgcolor: "#555" },
              }}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Create Lecture"}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateLecture;
