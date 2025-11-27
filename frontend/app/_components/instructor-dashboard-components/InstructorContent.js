import React, { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import EditIcon from "@mui/icons-material/Edit";
import { IconButton, useMediaQuery } from "@mui/material";
import { useRouter } from "next/navigation";
import dateFormat from "@/utils/dateFormat";
import RatingDisplay from "@/components/RatingDisplay";
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    whiteSpace: "nowrap",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

export default function InstructorContent() {
  const [courses, setCourses] = useState([]);
  const router = useRouter();
  const [enrollments, setEnrollments] = useState({});
  const isSmallScreen = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const fetchProjectsByInstructor = async () => {
      try {
        const apiResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/courses/all`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (apiResponse.status === 404) {
          setCourses([]);
          return;
        }
        if (!apiResponse.ok) {
          console.error("Error fetching courses");
          return;
        }

        const courses = await apiResponse.json();
        setCourses(courses);

        const enrollmentPromises = courses.map((course) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${course.id}/enrolled-count`,
            {
              method: "GET",
              credentials: "include",
            }
          )
            .then((response) => {
              if (response.ok) return response.json();
              if (response.status === 404) return { enrolledStudents: 0 };
              throw new Error("Failed to fetch enrollments");
            })
            .then((data) => ({
              courseId: course.id,
              enrolledStudents: data.enrolledStudents,
            }))
            .catch((error) => {
              console.error(
                `Error fetching enrollment for course ${course.id}:`,
                error.message
              );
              return { courseId: course.id, enrolledStudents: 0 };
            })
        );

        const enrollmentsData = await Promise.all(enrollmentPromises);

        const enrollmentsMap = enrollmentsData.reduce(
          (acc, { courseId, enrolledStudents }) => {
            acc[courseId] = enrolledStudents;
            return acc;
          },
          {}
        );

        setEnrollments(enrollmentsMap);
      } catch (error) {
        console.error("Error fetching projects", error.message);
      }
    };

    fetchProjectsByInstructor();
  }, []);

  const handleEdit = (id) => {
    router.push(`/instructor-dashboard/courses/${id}/edit-course`);
  };

  return (
    <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
      <Table sx={{ minWidth: 700 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell>Course Title</StyledTableCell>
            {!isSmallScreen && (
              <StyledTableCell align="right">Published Date</StyledTableCell>
            )}
            <StyledTableCell align="right">Rating</StyledTableCell>
            <StyledTableCell align="right">Enrolled</StyledTableCell>
            <StyledTableCell align="right">Settings</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {courses.length > 0 ? (
            courses.map((course, index) => (
              <StyledTableRow key={index}>
                <StyledTableCell component="th" scope="row">
                  {course.title}
                </StyledTableCell>
                {!isSmallScreen && (
                  <StyledTableCell align="right">
                    {dateFormat(course.createdAt)}
                  </StyledTableCell>
                )}
                <StyledTableCell align="right">
                  <RatingDisplay
                    averageRating={course.averageRating || 0}
                    ratingCount={course.ratingCount || 0}
                    size="small"
                  />
                </StyledTableCell>
                <StyledTableCell align="right">
                  {enrollments[course.id] !== undefined
                    ? enrollments[course.id]
                    : 0}
                </StyledTableCell>
                <StyledTableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(course.id)}
                    aria-label="edit"
                  >
                    <EditIcon />
                  </IconButton>
                </StyledTableCell>
              </StyledTableRow>
            ))
          ) : (
            <StyledTableRow>
              <StyledTableCell colSpan={5} align="center">
                There are no courses found
              </StyledTableCell>
            </StyledTableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
