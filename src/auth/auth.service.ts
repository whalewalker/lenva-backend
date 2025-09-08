import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, AuthResponse, UserRole } from '../common/types';
import { User } from '@/models';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user: User = await this.usersService.findByEmail(email);
    if (!user) return null;
    
    const isValid = await this.usersService.comparePassword(user, password);
    if (isValid) return user;
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto): Promise<{ message: string; user: { _id: string; email: string; name: string; role: string } }> {
    const exist = await this.usersService.existsByEmail(registerDto.email);
    if (exist) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.usersService.create(registerDto);
    return {
      message: 'Registration successful. Please login to continue.',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<User> {
    let user = await this.usersService.findByGoogleId(googleUser.googleId);
    
    if (!user) {
      user = await this.usersService.findByEmail(googleUser.email);
      
      if (user) {
        await this.linkGoogleAccount(user._id, googleUser);
      } else {
        user = await this.createGoogleUser(googleUser);
      }
    }

    return user;
  }

  private async linkGoogleAccount(userId: string, googleUser: any): Promise<void> {
    await this.usersService.updateGoogleData(userId, {
      provider: 'google',
      providerUserId: googleUser.googleId,
      avatarUrl: googleUser.avatar,
    });
  }

  private async createGoogleUser(googleUser: any): Promise<User> {
    const user = await this.usersService.create({
      email: googleUser.email,
      name: googleUser.name,
      password: Math.random().toString(36),
      role: UserRole.STUDENT,
    });
    
    await this.linkGoogleAccount(user._id, googleUser);
    return this.usersService.findOne(user._id);
  }

  async googleLogin(user: User): Promise<AuthResponse> {
    return this.generateTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthResponse> {
    const user = await this.usersService.findOne(userId);
    if (!user?.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokens(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      }),
    ]);

    // Hash and store refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(user._id, hashedRefreshToken);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        streak: user.streak?.current || 0,
        joinDate: user.createdAt?.toISOString() || new Date().toISOString(),
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
