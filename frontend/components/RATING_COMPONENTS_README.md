# Rating Components Documentation

This document provides usage examples for the rating system components.

## Components Overview

### 1. RatingDisplay

Displays average rating as stars with numerical value and rating count.

**Usage:**

```jsx
import RatingDisplay from "@/components/RatingDisplay";

<RatingDisplay
  averageRating={4.5}
  ratingCount={127}
  size="medium" // 'small', 'medium', or 'large'
/>;
```

### 2. RatingInput

Interactive star rating input with optional text review.

**Usage:**

```jsx
import RatingInput from "@/components/RatingInput";

<RatingInput
  initialRating={0}
  initialReview=""
  onSubmit={async (rating, review) => {
    // Handle submission
    await submitRating(courseId, rating, review);
  }}
  disabled={false}
/>;
```

### 3. ReviewList

Displays paginated list of course reviews.

**Usage:**

```jsx
import ReviewList from "@/components/ReviewList";

<ReviewList
  courseId="course-123"
  pageSize={10}
  fetchReviews={async (courseId, limit, lastKey) => {
    // Fetch reviews from API
    const response = await fetch(
      `/api/courses/${courseId}/ratings?limit=${limit}&lastKey=${lastKey}`
    );
    return response.json();
  }}
/>;
```

### 4. RatingStats

Shows rating distribution for instructor analytics.

**Usage:**

```jsx
import RatingStats from "@/components/RatingStats";

<RatingStats
  distribution={{
    5: 70,
    4: 35,
    3: 15,
    2: 5,
    1: 2,
  }}
  totalRatings={127}
  averageRating={4.5}
/>;
```

## Integration Examples

### Course Detail Page

```jsx
import RatingDisplay from "@/components/RatingDisplay";
import RatingInput from "@/components/RatingInput";
import ReviewList from "@/components/ReviewList";

export default function CourseDetailPage({ course, isEnrolled }) {
  return (
    <div>
      <h1>{course.title}</h1>

      {/* Display average rating */}
      <RatingDisplay
        averageRating={course.averageRating}
        ratingCount={course.ratingCount}
        size="large"
      />

      {/* Allow enrolled students to rate */}
      {isEnrolled && (
        <RatingInput
          initialRating={myRating?.rating || 0}
          initialReview={myRating?.review || ""}
          onSubmit={handleSubmitRating}
        />
      )}

      {/* Show all reviews */}
      <ReviewList courseId={course.id} fetchReviews={fetchCourseReviews} />
    </div>
  );
}
```

### Instructor Dashboard

```jsx
import RatingStats from "@/components/RatingStats";

export default function InstructorDashboard({ courses }) {
  return (
    <div>
      {courses.map((course) => (
        <div key={course.id}>
          <h2>{course.title}</h2>
          <RatingStats
            distribution={course.ratingDistribution}
            totalRatings={course.ratingCount}
            averageRating={course.averageRating}
          />
        </div>
      ))}
    </div>
  );
}
```

## Features

### RatingDisplay

- ✅ Star visualization (full, half, empty stars)
- ✅ Numerical rating display
- ✅ Rating count
- ✅ Size variants (small, medium, large)
- ✅ Zero ratings handling

### RatingInput

- ✅ Interactive star selection
- ✅ Hover effects
- ✅ Optional text review (max 1000 chars)
- ✅ Character count display
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling

### ReviewList

- ✅ Paginated display (10 per page)
- ✅ Reviewer name, rating, text, date
- ✅ Sorted by date (newest first)
- ✅ Empty state handling
- ✅ Loading state
- ✅ Error handling
- ✅ Relative date formatting

### RatingStats

- ✅ Bar chart visualization
- ✅ 1-5 star distribution
- ✅ Percentage calculations
- ✅ Color-coded bars (green/yellow/red)
- ✅ Summary statistics (positive/neutral/negative)
- ✅ Empty state handling
