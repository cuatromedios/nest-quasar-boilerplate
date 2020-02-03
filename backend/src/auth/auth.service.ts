import {HttpException, Injectable} from '@nestjs/common'
import {LoginDto} from './dto/login.dto'
import {User} from '../user/user.entity'
import {InjectRepository} from '@nestjs/typeorm'
import {Repository} from 'typeorm'
import * as bcrypt from 'bcrypt'
import * as uuid from 'uuid/v4'
import {Token} from './token.entity'

const sha256 = require('sha256')

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Token)
    private readonly tokenRepo: Repository<Token>,
  ) {
  }

  async generateToken(user_id) {
    let rawToken = uuid()
    let token = new Token()
    token.user_id = user_id
    token.token = rawToken
    await this.tokenRepo.save(token)
    return rawToken
  }

  async userFromToken(rawToken) {
    if (!rawToken) return null
    rawToken = rawToken.split(' ')[1]
    let hashed = sha256(rawToken)
    let token = await this.tokenRepo.findOne({token: hashed})
    return this.userRepo.findOne(token?.user_id)
  }

  me() {

  }

  async login(dto: LoginDto) {
    let user = await this.userRepo.createQueryBuilder()
      .addSelect('User.password')
      .where({email: dto.email.toLowerCase()})
      .getOne()
    if (!user || !bcrypt.compareSync(dto.password, user.password)) {
      throw new HttpException('invalid_credentials', 422)
    }
    let token = await this.generateToken(user.id)
    return {token}
  }

  logout() {

  }
}
