import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "@/models";    
import { AbstractRepository } from "@/repo/abstract.repository";


@Injectable()
export class UsersRepository extends AbstractRepository<User>{
    constructor(@InjectModel(User.name) userModel: Model<User>) {
        super(userModel, User.name);
    }
}