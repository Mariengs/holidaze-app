import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // "/" → home
  index("routes/Home/home.tsx"),

  // "/venues" → alle innlegg
  route("venues", "routes/Venues/venues.tsx"),

  // "/profile" → du kan lage denne neste
  // route("profile", "routes/Profile/profile.tsx"),
] satisfies RouteConfig;
