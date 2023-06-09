const Router = require('express').Router
const userController = require('../controllers/user-controller')
const router = new Router()
const { body } = require('express-validator')
const authMiddleware = require('../middlewares/auth-middleware')
const todoController = require('../controllers/todo-controller')

router.post(
  '/registration',
  body('email').isEmail(),
  body('password').isLength({ min: 3, max: 32 }),
  userController.registration,
)
router.post('/login', userController.login)
router.post('/logout', userController.logout)
router.get('/activate/:link', userController.activate)
router.get('/refresh', userController.refresh)
router.get('/users', authMiddleware, userController.getUsers)

router.post('/addTodo', todoController.addTodo)
router.get('/getList', todoController.todoList)
router.post('/removeTodo', todoController.removeTodo)
router.post('/checkDeadline', todoController.checkDeadline)
router.post('/notice3h', todoController.hours3Left)
router.post('/editTodo', todoController.editTodo)

module.exports = router
