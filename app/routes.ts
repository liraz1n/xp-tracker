import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("privacidade", "routes/privacy.tsx"),
  route("termos", "routes/terms.tsx"),
] satisfies RouteConfig;
