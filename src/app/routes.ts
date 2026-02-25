import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Home from "./pages/Home";
import Search from "./pages/Search";
import MangaDetails from "./pages/MangaDetails";
import Reader from "./pages/Reader";
import Profile from "./pages/Profile";
import Login from "./pages/Login";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "search",
        Component: Search,
      },
      {
        path: "manga/:id",
        Component: MangaDetails,
      },
      {
        path: "read/:chapterId",
        Component: Reader,
      },
      {
        path: "profile",
        Component: Profile,
      },
      {
        path: "login",
        Component: Login,
      },
    ],
  },
]);
