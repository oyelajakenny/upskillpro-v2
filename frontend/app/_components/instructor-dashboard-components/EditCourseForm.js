import React from "react";
import Button from "@mui/material/Button";
import {
  Alert,
  AlertTitle,
  Box,
  Container,
  Paper,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
const EditCourseForm = ({
  formData,
  onSubmit,
  onInputChange,
  loading,
  error,
  categories = [],
  categoryLoading = false,
}) => {
  return (
    <>
      <Container maxWidth="md" sx={{ mt: 14, mb: 4 }}>
        <Box sx={{ my: 4 }}>
          <Typography
            variant="h4"
            component="h2"
            align="center"
            sx={{ color: "black" }}
          >
            Edit the course
          </Typography>
          <Typography variant="body1" align="center">
            Edit title ,description of a course
          </Typography>
        </Box>
        <Container maxWidth="sm">
          <Paper elevation={4} sx={{ p: 3 }}>
            <form onSubmit={onSubmit}>
              <TextField
                fullWidth
                type="text"
                label="Course Title"
                name="title"
                value={formData.title}
                margin="normal"
                size="small"
                onChange={onInputChange}
                required
              />

              <TextField
                fullWidth
                label="Description"
                name="description"
                type="text"
                value={formData.description}
                margin="normal"
                size="small"
                multiline
                rows={4}
                onChange={onInputChange}
                required
              />

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category-select"
                  name="categoryId"
                  value={formData.categoryId || ""}
                  label="Category"
                  onChange={onInputChange}
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
              </FormControl>
              {error && (
                <div className="bg-red-100 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="small"
                sx={{
                  mt: 2,
                  backgroundColor: "black",
                  color: "#fff", // Text color
                  "&:hover": {
                    backgroundColor: "#374151",
                  },
                }}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </Paper>
        </Container>
      </Container>
    </>
  );
};

export default EditCourseForm;
