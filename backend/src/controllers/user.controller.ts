import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import type { UpdateUserProfileDTO } from "../services/interfaces/IUserService";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }



}
