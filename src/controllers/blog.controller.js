import slugify from "slugify";
import { Blog } from "../models/blog.model.js";
import { ApiError } from "../utlis/apiError.js";
import asyncHandler from "../utlis/asyncHandler.js";
import { uploadOnCloudinary } from "../utlis/fileUpload.js";
import { ApiResponse } from '../utlis/apiResponse.js';
import sanitizeHtml from "sanitize-html"; 

const addBlog = asyncHandler(async (req, res) => {
  const { title, content, categoryId } = req.body;

  if (!title || !content || !categoryId) {
    throw new ApiError(404, "Title, Content and CategoryId are required");
  }

  const user = req.user;

  const slug = slugify(title, { lower: true });

  const thumbnailLocalPath = req.file.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const thumbnailUploadCloudninary = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnailUploadCloudninary) {
    throw new ApiError(501, "Thumbnail uploading error");
  }

  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'br', 'img'],
    allowedAttributes: {
      'a': ['href', 'name', 'target'],
      'img': ['src']
    }
  });

  const newBlog = await Blog.create({
    title,
    content: sanitizedContent, 
    slug,
    category: categoryId,
    author: user._id,
    thumbnail: thumbnailUploadCloudninary.url
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newBlog, "Blog added successfully"));
});

const updateBlog = asyncHandler(async (req, res) => {
  const { title, blogId, content } = req.body;

  if (!blogId || (!title && !content && !req.file)) {
    throw new ApiError(
      402,
      "Blog ID is required and at least one of Title, Content, or Thumbnail must be provided"
    );
  }

  const user = req.user;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  if (blog.author.toString() !== user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this blog");
  }

  const updateData = {};

  if (title) {
    updateData.title = title;
    updateData.slug = slugify(title, { lower: true });
  }

  if (content) {
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: ["b", "i", "em", "strong", "a", "p", "ul", "li", "br", "img"],
      allowedAttributes: {
        a: ["href", "name", "target"],
        img: ["src"],
      },
    });
    updateData.content = sanitizedContent;
  }

  if (req.file && req.file.path) {
    const thumbnailUploadCloudinary = await uploadOnCloudinary(req.file.path);
    if (!thumbnailUploadCloudinary) {
      throw new ApiError(500, "Thumbnail uploading failed");
    }
    updateData.thumbnail = thumbnailUploadCloudinary.url;
  }
  

  const updatedBlog = await Blog.findByIdAndUpdate(blogId, updateData, {
    new: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBlog, "Blog updated successfully"));
});


const deletBloge = asyncHandler(async (req, res) => {
  const { blogId } = req.body;

  if (!blogId) {
    throw new ApiError(403, "BlogId is required");
  }

  const user = req.user;

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const blog = await Blog.findById(blogId); 

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  if (blog.author.toString() !== user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this blog");
  }

  const deleteBlog = await Blog.findByIdAndDelete(blogId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Successfully deleted blog",));
});


const allBlogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  const totalBlogs = await Blog.countDocuments();

  const blogs = await Blog.find()
    .populate("author", "name email")
    .populate("category", "name")
    .sort({ createdAt: -1 }) 
    .skip(skip)
    .limit(limit);

  res.status(200).json(
    new ApiResponse(200, {
      blogs,
      pagination: {
        totalBlogs,
        currentPage: page,
        totalPages: Math.ceil(totalBlogs / limit),
      },
    }, "Paginated blogs fetched successfully")
  );
});


const userBlogs = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userBlogs = await Blog.find({ author: user._id }).populate("author", "fullName email").populate("category","name");

  return res.status(200).json(
    new ApiResponse(200, userBlogs, "User blogs fetched successfully")
  );
});



export { addBlog ,updateBlog,deletBloge,allBlogs,userBlogs};

