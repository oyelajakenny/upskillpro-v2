export function returnPathByRole(role) {
  const validRoles = ["instructor", "student", "admin", "super_admin"];
  if (!validRoles.includes(role)) {
    throw new Error("User is not authorized");
  }
  switch (role) {
    case "instructor":
      return "/instructor-dashboard";
    case "admin":
    case "super_admin":
      return "/admin-dashboard";
    case "student":
      return "/student-dashboard";
    default:
      return "/";
  }
}
