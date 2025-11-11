import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, password: string, firstName: string, lastName: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async findOrCreateGoogleUser(googleData: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }): Promise<User> {
    // Try to find by googleId first
    let user = await this.usersRepository.findOne({ where: { googleId: googleData.googleId } });
    
    if (user) {
      // Update user info if changed
      user.firstName = googleData.firstName;
      user.lastName = googleData.lastName;
      user.picture = googleData.picture;
      return this.usersRepository.save(user);
    }

    // Try to find by email (user might have registered with email/password)
    user = await this.usersRepository.findOne({ where: { email: googleData.email } });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = googleData.googleId;
      user.picture = googleData.picture;
      return this.usersRepository.save(user);
    }

    // Create new user
    const newUser = this.usersRepository.create({
      email: googleData.email,
      googleId: googleData.googleId,
      firstName: googleData.firstName,
      lastName: googleData.lastName,
      picture: googleData.picture,
      password: null, // No password for Google OAuth users
    });

    return this.usersRepository.save(newUser);
  }
}
