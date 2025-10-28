import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/Home/home.tsx"),
  route("venues", "routes/Venues/venues.tsx"),
  route("venues/:id", "routes/Venues/$id.tsx"),
  route("profile", "routes/Profile/profile.tsx"),
  route("register", "routes/Register/register.tsx"),
] satisfies RouteConfig;
