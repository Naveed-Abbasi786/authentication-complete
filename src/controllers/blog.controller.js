import slugify from "slugify";
import { Blog } from "../models/blog.model.js";
import { ApiError } from "../utlis/apiError.js";
import asyncHandler from "../utlis/asyncHandler.js";
import { uploadOnCloudinary } from "../utlis/fileUpload.js";
import { ApiResponse } from "../utlis/apiResponse.js";
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

  const thumbnailUploadCloudninary = await uploadOnCloudinary(
    thumbnailLocalPath
  );

  if (!thumbnailUploadCloudninary) {
    throw new ApiError(501, "Thumbnail uploading error");
  }

  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: ["b", "i", "em", "strong", "a", "p", "ul", "li", "br", "img"],
    allowedAttributes: {
      a: ["href", "name", "target"],
      img: ["src"],
    },
  });

  const newBlog = await Blog.create({
    title,
    content: sanitizedContent,
    slug,
    category: categoryId,
    author: user._id,
    thumbnail: thumbnailUploadCloudninary.url,
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
      allowedTags: [
        "b",
        "i",
        "em",
        "strong",
        "a",
        "p",
        "ul",
        "li",
        "br",
        "img",
      ],
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
    .json(new ApiResponse(200, "Successfully deleted blog"));
});

const allBlogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  // 👇 Count only non-deleted and public blogs
  const totalBlogs = await Blog.countDocuments({
    isPublic: true,
    isDeleted: false,
  });

  const blogs = await Blog.find({
    isPublic: true,
    isDeleted: false,
  })
    .populate({
      path: "comments",
      populate: [
        {
          path: "author",
          select: "fullName email",
        },
        {
          path: "replies",
          populate: {
            path: "author",
            select: "fullName email",
          },
          populate: {
            path: "replies",
            select: "content",
            populate: {
              path: "author",
              select: "fullName email",
            },
          },
        },
      ],
    })

    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        blogs,
        pagination: {
          totalBlogs,
          currentPage: page,
          totalPages: Math.ceil(totalBlogs / limit),
        },
      },
      "Paginated blogs fetched successfully"
    )
  );
});

const userBlogs = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userBlogs = await Blog.find({ author: user._id, isDeleted: false })
    .populate("author", "fullName email")
    .populate("category", "name");

  return res
    .status(200)
    .json(new ApiResponse(200, userBlogs, "User blogs fetched successfully"));
});

const blogDetails = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    throw new ApiError(400, "Slug is required");
  }

  const blogDetail = await Blog.findOne({ slug })
    .populate("author", "fullName email")
    .populate("category", "name");

  if (!blogDetails) {
    throw new ApiError(404, "Blog not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, blogDetail, "Blog successfully fetched"));
});

const likeDislikeToggle = asyncHandler(async (req, res) => {
  const { blogId } = req.body;
  const userId = req.user._id;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  // Check if the user has liked or disliked the blog
  const hasLiked = blog.likes.includes(userId);
  const hasDisliked = blog.dislikes.includes(userId);

  let message = "";

  if (hasLiked) {
    // Remove like if the user had already liked it
    blog.likes.pull(userId);
    message = "Like removed successfully";

    // If no other user has liked, set isLiked to false
    if (blog.likes.length === 0) {
      blog.isLiked = false;
    }
  } else {
    // Add like if the user hasn't liked it yet
    blog.likes.push(userId);
    message = "Blog liked successfully";

    // If the user had previously disliked, remove dislike
    if (hasDisliked) {
      blog.dislikes.pull(userId);
    }

    // Set isLiked to true after adding like
    blog.isLiked = true;
  }

  // Save the blog after modification
  await blog.save();

  return res.status(200).json(new ApiResponse(200, blog, message));
});

const publicPrivateToggle = asyncHandler(async (req, res) => {
  const { blogId } = req.body;

  if (!blogId) {
    throw new ApiError(404, "blogId is required");
  }

  const userId = req.user._id;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  if (blog.author.toString() !== userId.toString()) {
    throw new ApiError(
      402,
      "Unauthorized request. You are not allowed to perform this action."
    );
  }

  let message = "";
  if (blog.isPublic) {
    blog.isPublic = false;
    message = "Blog is now private successfully";
  } else {
    blog.isPublic = true;
    message = "Blog is now public successfully";
  }

  await blog.save();

  return res.status(200).json(new ApiResponse(200, blog, message));
});

const softDelete = asyncHandler(async (req, res) => {
  const { blogId } = req.body;

  if (!blogId) {
    throw new ApiError(404, "blogId is required");
  }

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(404, "User not found");
  }

  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  blog.isDeleted = true;
  await blog.save(); // await important hai!

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Blog has been deleted successfully"));
});

const searchBlogs = asyncHandler(async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    throw new ApiError(400, "Keyword is required for search");
  }

  const blogs = await Blog.find({
    $or: [
      {
        title: { $regex: keyword.trim().replace(/\s+/g, ".*"), $options: "i" },
      },
      { content: { $regex: keyword.replace(/\s+/g, ".*"), $options: "i" } },
      { slug: { $regex: keyword.replace(/\s+/g, ".*"), $options: "i" } },
    ],
    isPublic: true,
    isDeleted: false,
  }).populate({
    path: "comments",
    populate: [
      {
        path: "author",
        select: "fullName email",
      },
      {
        path: "replies",
        populate: {
          path: "author",
          select: "fullName email",
        },
        populate: {
          path: "replies",
          select: "content",
          populate: {
            path: "author",
            select: "fullName email",
          },
        },
      },
    ],
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, { blogs }, "Search results fetched successfully")
    );
});

export {
  addBlog,
  updateBlog,
  deletBloge,
  allBlogs,
  userBlogs,
  blogDetails,
  likeDislikeToggle,
  publicPrivateToggle,
  softDelete,
  searchBlogs,
};
