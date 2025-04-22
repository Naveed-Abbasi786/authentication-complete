import slugify from "slugify"; 
import { Category } from "../models/category.model.js";
import { ApiError } from "../utlis/apiError.js";
import { ApiResponse } from "../utlis/apiResponse.js";
import asyncHandler from "../utlis/asyncHandler.js";

const addcategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(402, "Name is required");
  }

  const slug = slugify(name, { lower: true });
  const user = req.user;

  // 🔍 Check if same user already has same category
  const existingCategory = await Category.findOne({
    slug,
    author: user._id,
  });

  if (existingCategory) {
    throw new ApiError(409, "Category with same name already exists");
  }

  const CategoryAdd = await Category.create({
    name,
    slug,
    author: user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(200, CategoryAdd, "Category added successfully"));
});



const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate("author", "name email"); 

  res
    .status(200)
    .json(new ApiResponse(200, categories, "All categories fetched successfully"));
});


const getUserCategories = asyncHandler(async (req, res) => {
  const user = req.user;

  const categories = await Category.find({ author: user._id });

  res
    .status(200)
    .json(new ApiResponse(200, categories, "User's categories fetched successfully"));
});

const categoryUpdate = asyncHandler(async (req, res) => {
  const { name, categoryId } = req.body;

  if (!name || !categoryId) {
    throw new ApiError(400, "Name and categoryId are required");
  }

  const user = req.user;
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  
  if (category.author.toString() !== user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this category");
  }
  
  const slug = slugify(name, { lower: true });
  

  category.name = name;
  category.slug=slug
  await category.save();

  res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
});


const categoryDelete = asyncHandler(async (req, res) => {
  const { categoryId } = req.body;

  if (!categoryId) {
    throw new ApiError(402, "CategoryId is required");
  }

  const user = req.user;

  if (!user) {
    throw new ApiError(403, "User not found");
  }

  const deletedCategory = await Category.findByIdAndDelete(categoryId);

  if (!deletedCategory) {
    throw new ApiError(404, "Category not found or already deleted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Category deleted successfully"));
});




export { addcategory,getAllCategories ,getUserCategories,categoryUpdate,categoryDelete};
