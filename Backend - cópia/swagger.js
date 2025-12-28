const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EstadioPWA API',
      version: '1.0.0',
      description: 'API documentation for Estadio - Stadium Management System',
      contact: {
        name: 'API Support',
        email: 'support@estadio.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in httpOnly cookie. Login via /auth/login to get the token.'
        },
      },
      security: [
        {
          cookieAuth: []
        }
      ],
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User name (unique)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email (unique)'
            },
            password: {
              type: 'string',
              description: 'User password (hashed)'
            },
            role: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  enum: ['admin', 'user']
                },
                scope: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['admin', 'member', 'notMember', 'anonimous']
                  }
                }
              }
            },
            age: {
              type: 'number',
              description: 'User age'
            },
            address: {
              type: 'string',
              description: 'User address'
            },
            country: {
              type: 'string',
              description: 'User country'
            },
            taxNumber: {
              type: 'number',
              description: 'Tax identification number (unique)'
            },
            memberId: {
              type: 'string',
              description: 'Reference to Member document'
            },
            tickets: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of ticket IDs'
            }
          }
        },
        Member: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Member ID'
            },
            taxNumber: {
              type: 'string',
              description: 'Tax identification number'
            },
            photo: {
              type: 'string',
              description: 'Photo URL or path'
            },
            userId: {
              type: 'string',
              description: 'Reference to User document'
            }
          }
        },
        Game: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Game ID',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              description: 'Game name',
              example: 'FC Porto vs Benfica'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Game date and time',
              example: '2024-12-25T20:00:00.000Z'
            },
            stadiumId: {
              type: 'string',
              description: 'Reference to Stadium document',
              example: '507f1f77bcf86cd799439012'
            },
            image: {
              type: 'string',
              description: 'Game image URL',
              example: '/uploads/games/game-1234567890.png'
            }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Ticket ID',
              example: '507f1f77bcf86cd799439013'
            },
            sector: {
              type: 'string',
              description: 'Stadium sector',
              example: 'Sector A'
            },
            price: {
              type: 'number',
              description: 'Ticket price',
              example: 25.50
            },
            gameId: {
              type: 'string',
              description: 'Reference to Game document',
              example: '507f1f77bcf86cd799439011'
            },
            userId: {
              type: 'string',
              description: 'Reference to User document',
              example: '507f1f77bcf86cd799439014'
            },
            isMember: {
              type: 'boolean',
              description: 'Whether the ticket was purchased with member discount',
              example: true
            }
          }
        },
        Stadium: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Stadium ID',
              example: '507f1f77bcf86cd799439012'
            },
            name: {
              type: 'string',
              description: 'Stadium name',
              example: 'Estádio do Dragão'
            },
            sectors: {
              type: 'array',
              description: 'Stadium sectors with pricing',
              items: {
                type: 'object',
                properties: {
                  sector: {
                    type: 'string',
                    example: 'Sector A'
                  },
                  price: {
                    type: 'number',
                    description: 'Regular ticket price',
                    example: 30.00
                  },
                  priceMember: {
                    type: 'number',
                    description: 'Member ticket price',
                    example: 25.00
                  }
                }
              },
              example: [
                {
                  sector: 'Sector A',
                  price: 30.00,
                  priceMember: 25.00
                },
                {
                  sector: 'Sector B',
                  price: 25.00,
                  priceMember: 20.00
                }
              ]
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            message: {
              type: 'string',
              description: 'Detailed error message'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['name', 'password'],
          properties: {
            name: {
              type: 'string',
              description: 'Username'
            },
            password: {
              type: 'string',
              description: 'User password'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            auth: {
              type: 'boolean',
              description: 'Authentication status'
            },
            token: {
              type: 'string',
              description: 'JWT token'
            },
            qrCode: {
              type: 'string',
              description: 'Base64 encoded QR code image'
            },
            decoded: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                name: {
                  type: 'string'
                },
                role: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'address', 'country', 'taxNumber', 'role'],
          properties: {
            name: {
              type: 'string',
              description: 'Username (must be unique)',
              example: 'admin'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email (must be unique)',
              example: 'admin@estadio.com'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              example: 'password123'
            },
            role: {
              type: 'object',
              required: ['name', 'scope'],
              properties: {
                name: {
                  type: 'string',
                  enum: ['admin', 'user'],
                  example: 'admin'
                },
                scope: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['admin', 'member', 'notMember', 'anonimous']
                  },
                  description: 'Must include "admin" to create an admin user',
                  example: ['admin']
                }
              }
            },
            age: {
              type: 'number',
              description: 'User age (optional)',
              example: 30
            },
            address: {
              type: 'string',
              description: 'User address',
              example: '123 Main Street'
            },
            country: {
              type: 'string',
              description: 'User country',
              example: 'Portugal'
            },
            taxNumber: {
              type: 'number',
              description: 'Tax identification number (must be unique)',
              example: 123456789
            }
          }
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'User saved'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            auth: {
              type: 'boolean',
              example: true
            },
            token: {
              type: 'string',
              description: 'JWT token for the newly created user'
            },
            decoded: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                name: {
                  type: 'string'
                },
                role: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Games',
        description: 'Game management endpoints'
      },
      {
        name: 'Tickets',
        description: 'Ticket management endpoints'
      },
      {
        name: 'Stadium',
        description: 'Stadium management endpoints'
      },
      {
        name: 'Member Requests',
        description: 'Member request management endpoints'
      }
    ]
  },
  apis: [
    './server/*.js', // Caminho para os arquivos com anotações Swagger
    './index.js'
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

