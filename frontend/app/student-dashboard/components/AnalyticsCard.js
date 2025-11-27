import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import SchoolIcon from "@mui/icons-material/School";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PaidIcon from "@mui/icons-material/Paid";
import { CircleDollarSign } from "lucide-react";
import { GraduationCap } from "lucide-react";
import { BookOpenText } from "lucide-react";

const AnalyticsCard = ({ totalRevenue, totalStudents, totalCourses }) => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(250px, 100%), 1fr))",
        gap: 2,
      }}
    >
      <Card>
        <CardContent
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "black",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircleDollarSign size={36} color="#ffffff" />
          </Box>

          <Box textAlign="right">
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold", color: "black" }}
            >
              Total Revenue
            </Typography>
            <Typography
              variant="h5"
              sx={{ mt: 1, fontWeight: "bold", color: "#212121" }}
            >
              {totalRevenue}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "black",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={32} color="#ffffff" />
          </Box>

          <Box textAlign="right">
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold", color: "black" }}
            >
              Students
            </Typography>
            <Typography
              variant="h5"
              sx={{ mt: 1, fontWeight: "bold", color: "#212121" }}
            >
              {totalStudents}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      <Card>
        <CardContent
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "black",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpenText size={32} color="#ffffff" />
          </Box>

          <Box textAlign="right">
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold", color: "black" }}
            >
              Courses
            </Typography>
            <Typography
              variant="h5"
              sx={{ mt: 1, fontWeight: "bold", color: "#212121" }}
            >
              {totalCourses}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalyticsCard;
