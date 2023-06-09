const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const tokenService = require('../service/token-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')

class UserService {
  async registration(email, password) {
    const candidate = await UserModel.findOne({ email })
    if (candidate) {
      throw ApiError.BadRequest(
        `Пользователь с почтовым адрессом ${email} уже существует`,
      )
    }

    const hashPassword = await bcrypt.hash(password, 3)
    const activationLink = uuid.v4()

    const user = await UserModel.create({
      email,
      password: hashPassword,
      activationLink,
    })
    await mailService.sendActivationMail(
      email,
      `${process.env.API_URL}/api/activate/${activationLink}`,
    )

    const userDto = new UserDto(user) // id email isActivated
    const tokens = tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return { ...tokens, user: userDto }
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({ activationLink })
    if (!user) {
      throw ApiError.BadRequest('wrong activation link')
    }
    user.isActivated = true
    await user.save()
  }

  async login(email, password) {
    const user = await UserModel.findOne({ email })
    if (!user) {
      console.log(email, password)
      throw ApiError.BadRequest('Пользователь не был найден')
    }
    const isPassEquals = await bcrypt.compare(password, user.password)
    if (!isPassEquals) {
      throw ApiError.BadRequest('Пароль неверен')
    }
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return { ...tokens, userDto }
  }
  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken)
    return token
  }
  async refresh(refreshToken) {
    if (!refreshToken) {
      console.log('where is your refreshToken?', refreshToken)
      throw ApiError.UnauthorizedError()
    }
    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)
    if (!userData || !tokenFromDb) {
      console.log(userData, tokenFromDb)
      throw ApiError.UnauthorizedError()
    }
    const user = await UserModel.findById(userData.id)
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })

    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return { ...tokens, user: userDto }
  }

  async getAllUsers() {
    const users = await UserModel.find()
    return users
  }
}

module.exports = new UserService()
