const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PTPro API',
      version: '1.0.0',
      description: 'API documentation for PTPro - Personal Trainer Management System',
      contact: {
        name: 'API Support',
        email: 'support@ptpro.com'
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
              example: 'admin@ptpro.com'
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

