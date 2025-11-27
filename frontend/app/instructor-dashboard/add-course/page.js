"use client";
import Button from "@mui/material/Button";
import UploadIcon from "@mui/icons-material/Upload";
import React, { useState, useEffect } from "react";
import { handleFileUpload } from "@/utils/handleFileUpload";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  addCourse,
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
} from "@/features/course/courseSlice";
import { fetchCategories } from "@/utils/api/categoryApi";
import {
  Alert,
  Box,
  Container,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";

const CreateCourse = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const { categories, categoryLoading } = useSelector((state) => state.courses);

  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      dispatch(fetchCategoriesStart());
      try {
        const categoriesData = await fetchCategories();
        dispatch(fetchCategoriesSuccess(categoriesData));
      } catch (error) {
        dispatch(fetchCategoriesFailure(error.message));
        toast.error("Failed to load categories");
      }
    };

    if (categories.length === 0) {
      loadCategories();
    }
  }, [dispatch, categories.length]);

  const handleImageChange = (event) => {
    const selectedImage = event.target.files[0];

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    if (selectedImage && selectedImage.size / (1024 * 1024) > 5) {
      setErrors({ ...errors, image: "File size exceeds 5MB limit" });
      setImagePreview(null);
      event.target.value = "";
    } else {
      setImage(selectedImage);
      setImagePreview(URL.createObjectURL(selectedImage));
      setErrors({ ...errors, image: null });
    }
  };

  const checkForErrors = () => {
    const errors = {};
    if (!title.trim()) errors.title = "Please provide a valid title";
    if (!description.trim())
      errors.description = "Please provide a valid description";
    if (isNaN(price) || price < 0)
      errors.price = "Please provide a valid price";
    // if (!categoryId) errors.categoryId = "Please select a category";
    if (!image) errors.image = "Please upload an image";
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
      const imageKey = await handleFileUpload(image);
      const apiResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title,
            description,
            imageKey,
            price,
            categoryId,
          }),
        }
      );

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        dispatch(addCourse(result));
        toast.success("Course created successfully! 🎉");
        setTitle("");
        setDescription("");
        setPrice("");
        setCategoryId("");
        setImage(null);
        setImagePreview(null);
        router.push("/instructor-dashboard");
      } else {
        const errorData = await apiResponse.json();
        toast.error(errorData.message || "Error creating the course");
        console.error("Error creating the course");
      }
    } catch (error) {
      console.error("Error while submitting:", error);
      toast.error("Failed to create course");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 6 }}>
      <Stack spacing={2} textAlign="center">
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.4rem", sm: "1.8rem" },
            color: "#1a202c",
          }}
        >
          Create a New Course
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: "#4a5568",
            fontSize: { xs: "1rem", sm: "1.2rem" },
          }}
        >
          Fill in the details below to create your course.
        </Typography>
      </Stack>

      {/* Form Card */}
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
            <Stack spacing={2}>
              {/* Course Title */}
              <TextField
                fullWidth
                label="Course Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                required
              />

              {/* Course Description */}
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                required
              />

              {/* Course Price */}
              <TextField
                fullWidth
                label="Price (DKK)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={!!errors.price}
                helperText={errors.price}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">DKK</InputAdornment>
                  ),
                }}
              />

              {/* Category Selection */}
              <FormControl fullWidth error={!!errors.categoryId} >
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category-select"
                  value={categoryId}
                  label="Category"
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={categoryLoading}
                >
                  {categories.map((category) => (
                    <MenuItem
                      key={category.categoryId}
                      value={category.categoryId}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoryId && (
                  <FormHelperText>{errors.categoryId}</FormHelperText>
                )}
              </FormControl>

              {/* Image Preview */}
              {imagePreview && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      borderRadius: "8px",
                    }}
                  />
                </Box>
              )}

              {/* Image Upload */}
              <Stack alignItems="center">
                <label htmlFor="image-upload">
                  <Button
                    variant="contained"
                    component="span"
                    sx={{ bgcolor: "#333", "&:hover": { bgcolor: "#555" } }}
                  >
                    <UploadIcon sx={{ mr: 1 }} />
                    Upload an Image
                  </Button>
                </label>
                <input
                  type="file"
                  id="image-upload"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {errors.image && (
                  <Typography color="error">{errors.image}</Typography>
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
                  "&:hover": { bgcolor: "#555" },
                }}
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Create Course"}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateCourse;
