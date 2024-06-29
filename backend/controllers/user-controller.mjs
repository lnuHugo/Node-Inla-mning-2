import User from "../models/UserModel.mjs";
import ErrorResponse from "../models/ErrorResponseModel.mjs";
import { asyncHandler } from "../middleware/asyncHandler.mjs";

export const createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({ success: true, statusCode: 201, data: user });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(204).send();
});

export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user)
    next(
      new ErrorResponse(`Ingen användare med id: ${req.params.id} kund hittas`)
    );

  res.status(200).json({ success: true, statusCode: 200, data: user });
});

export const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({ success: true, statusCode: 200, data: users });
});

export const updateUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.params.id, req.body, {
    runValidators: true,
  });

  res.status(204).send();
});
