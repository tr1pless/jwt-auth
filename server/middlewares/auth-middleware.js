const ApiErrors = require('../exceptions/api-error')
const tokenService = require('../service/token-service')

module.exports = function (req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization

    if (!authorizationHeader) {
      return next(ApiErrors.UnauthorizedError())
    }
    const accessToken = authorizationHeader.split(' ')[1]
    console.log(accessToken)

    if (!accessToken) {
      return next(ApiErrors.UnauthorizedError())
    }
    const userData = tokenService.validateAccessToken(accessToken)
    if (!userData) {
      return next(ApiErrors.UnauthorizedError())
    }
    req.user = userData
    next()
  } catch (e) {
    return next(ApiErrors.UnauthorizedError())
  }
}