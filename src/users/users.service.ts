import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import { ApiResponse } from '@/common/dto/response.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    const { password, ...userData } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersRepository.create({
      ...userData,
      passwordHash,
      avatar: userData.avatar || '', // Provide default value for required field
    });
    return ApiResponse.success(user, 'User created successfully');
  }

  async createInternal(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersRepository.create({
      ...userData,
      passwordHash,
      avatar: userData.avatar || '', // Provide default value for required field
    });
    return user;
  }

  async comparePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async findAll(): Promise<ApiResponse<User[]>> {
    const users = await this.usersRepository.find({});
    return ApiResponse.success(users, 'Users retrieved successfully');
  }

  async findOne(id: string): Promise<ApiResponse<User>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid user ID format`);
    }
    const user = await this.usersRepository.findOne({ _id: id });
    return ApiResponse.success(user, 'User retrieved successfully');
  }

  async findOneInternal(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid user ID format`);
    }
    const user = await this.usersRepository.findOne({ _id: id });
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ email });
    return user;
  }

  async existsByEmail(email: string): Promise<boolean> {
     const user = await this.usersRepository.findOneOrNull({ email });
     return !!user;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
      return await this.usersRepository.findOneOrNull({ 'oauth.providerUserId': googleId });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<ApiResponse<User>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid user ID format`);
    }
    const user = await this.usersRepository.findOneAndUpdate({ _id: id }, updateUserDto);
    return ApiResponse.success(user, 'User updated successfully');
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid user ID format`);
    }
    await this.usersRepository.findOneAndUpdate({ _id: id }, { refreshToken });
  }

  async updateGoogleData(id: string, googleData: {
    provider: string;
    providerUserId: string;
    avatarUrl?: string;
  }): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid user ID format`);
    }
    const updateData: any = {
      'oauth.provider': googleData.provider,
      'oauth.providerUserId': googleData.providerUserId,
    };
    
    if (googleData.avatarUrl) {
      updateData['profile.avatarUrl'] = googleData.avatarUrl;
    }
    
    await this.usersRepository.findOneAndUpdate({ _id: id }, updateData);
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid user ID format`);
    }
    await this.usersRepository.delete({ _id: id });
    return ApiResponse.success(undefined, 'User deleted successfully');
  }
}
