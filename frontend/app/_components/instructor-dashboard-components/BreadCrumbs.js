import * as React from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import { Typography } from "@mui/material";

export default function BreadCrumbs({ breadcrumbs }) {
  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      {breadcrumbs.map((breadcrumb, index) => {
        const lastIndex = breadcrumb.length - 1 === index;
        return lastIndex ? (
          <Typography color="text.primary" key={breadcrumb.href}>
            {breadcrumb.title}
          </Typography>
        ) : (
          <Link
            underline="hover"
            color="inherit"
            href={`${breadcrumb.href}`}
            key={breadcrumb.href}
          >
            {breadcrumb.title}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
