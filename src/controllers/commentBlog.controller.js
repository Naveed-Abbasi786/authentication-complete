import { Blog } from "../models/blog.model.js";
import Comment from "../models/commentBlog.model.js";
import { ApiError } from "../utlis/apiError.js";
import { ApiResponse } from '../utlis/apiResponse.js';
import asyncHandler from "../utlis/asyncHandler.js";

const addComment = asyncHandler(async (req, res) => {
  const { blogId, content } = req.body;

  if (!blogId || !content) {
    throw new ApiError(400, "Blog ID and content are required");
  }

  const user = req.user._id;

  // Find the blog by ID
  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  // Create a new comment
  const comment = await Comment.create({
    blog: blogId,
    author: user,
    content: content,
  });

  // Add the comment ID to the blog's comments array
  blog.comments.push(comment._id);
  await blog.save();

//   // Populate the blog details and return the response
//   const populatedBlog = await Blog.findById(blogId)
//     .populate("author", "fullName email")
//     .populate("category", "name")
//     .populate("comments");

  return res.status(200).json(
    new ApiResponse(200, { comment }, "Comment added successfully")
  );
});


const updateComment = asyncHandler(async (req, res) => {
  const { commentId, updatedComment } = req.body;

  if (!commentId || !updatedComment) {
    throw new ApiError(400, " commentId and updatedComment are required");
  }

  const user = req.user;

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.author.toString() !== user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this comment");
  }

  comment.content = updatedComment;
  await comment.save();

  return res.status(200).json(
    new ApiResponse(200, comment, "Comment updated successfully")
  );
});

const replyComments=asyncHandler(async(req,res)=>{
  const {commentId,replyComment}=req.body

  if(!commentId || !replyComment){
    throw new ApiError(403,"CommentId and ReplyComment are required")
  }
  const user=req.user._id

  if(!user)
  {
    throw new ApiError(404,"User not Found")
  }

  const parentComment =await Comment.findById(commentId)
  if (!parentComment) {
    throw new ApiError(404, "Parent comment not found");
  }

  const reply= await Comment.create({
    content:replyComment,
    blog:parentComment.blog,
    author: user._id,
    parentComment: parentComment._id,
  })

  parentComment.replies.push(reply._id)
  await parentComment.save();

  
  res.status(200).json(
    new ApiResponse(200, reply, "Reply added successfully")
  );
})


export { addComment,updateComment,replyComments };

