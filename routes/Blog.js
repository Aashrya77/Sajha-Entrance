import express from "express";
import { GetBlogs, SearchBlog, GetBlogData } from "../controllers/Blog.js";

const Router = express.Router();

Router.get("/blogs", GetBlogs);

Router.get("/blog/:id", GetBlogData);

Router.post("/blog/search", SearchBlog);

export default Router;
