const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  // บรรทัดนี้สำคัญมากเพื่อให้มันอ่าน TSX ออก
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest', 
  },
}

module.exports = createJestConfig(customJestConfig)