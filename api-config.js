// API Configuration for User Authentication and Data Sync
const API_CONFIG = {
    // Backend API Base URL - Update this to your actual backend URL
    BASE_URL: 'https://your-backend-api.com/api',
    
    // API Endpoints
    ENDPOINTS: {
        // Authentication endpoints
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH_TOKEN: '/auth/refresh',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        
        // User data endpoints
        GET_USER_DATA: '/user/data',
        SAVE_USER_DATA: '/user/data',
        SYNC_DATA: '/user/sync',
        
        // Health check
        HEALTH: '/health'
    },
    
    // Request timeout (in milliseconds)
    TIMEOUT: 10000,
    
    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

// For development/testing - you can use a mock API
const MOCK_API = {
    // Simulate API delay
    DELAY: 500,
    
    // Mock users database (in real app, this would be on the server)
    // Use localStorage to persist data between page loads
    get USERS() {
        const stored = localStorage.getItem('mock_users');
        return stored ? new Map(JSON.parse(stored)) : new Map();
    },
    
    set USERS(value) {
        localStorage.setItem('mock_users', JSON.stringify([...value]));
    },
    
    // Mock user data storage
    get USER_DATA() {
        const stored = localStorage.getItem('mock_user_data');
        return stored ? new Map(JSON.parse(stored)) : new Map();
    },
    
    set USER_DATA(value) {
        localStorage.setItem('mock_user_data', JSON.stringify([...value]));
    }
};

// Simple password hashing (in production, use proper bcrypt on server)
function simpleHash(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

// Generate a simple JWT-like token (in production, use proper JWT)
function generateToken(userId) {
    const payload = {
        userId: userId,
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(2)
    };
    return btoa(JSON.stringify(payload));
}

// Parse token
function parseToken(token) {
    try {
        return JSON.parse(atob(token));
    } catch (e) {
        return null;
    }
}

// Mock API functions for development
const MockAPI = {
    // Simulate network delay
    async delay(ms = MOCK_API.DELAY) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Register user
    async register(userData) {
        await this.delay();
        
        const { name, email, password } = userData;
        
        // Check if user already exists
        if (MOCK_API.USERS.has(email)) {
            throw new Error('User already exists with this email');
        }
        
        // Create user
        const userId = 'user_' + Date.now();
        const hashedPassword = simpleHash(password);
        
        const users = MOCK_API.USERS;
        users.set(email, {
            id: userId,
            name: name,
            email: email,
            password: hashedPassword,
            apiKey: null, // Store user's API key
            createdAt: new Date().toISOString()
        });
        MOCK_API.USERS = users;
        
        // Initialize user data
        const userDataMap = MOCK_API.USER_DATA;
        userDataMap.set(userId, {
            projects: [],
            flashcards: [],
            lastSync: new Date().toISOString()
        });
        MOCK_API.USER_DATA = userDataMap;
        
        const token = generateToken(userId);
        
        console.log('✅ User registered successfully:', { userId, name, email });
        console.log('📊 Total users in database:', MOCK_API.USERS.size);
        
        return {
            success: true,
            token: token,
            user: {
                id: userId,
                name: name,
                email: email
            }
        };
    },
    
    // Login user
    async login(credentials) {
        await this.delay();
        
        const { email, password } = credentials;
        const hashedPassword = simpleHash(password);
        
        const user = MOCK_API.USERS.get(email);
        console.log('🔍 Login attempt for email:', email);
        console.log('👥 Users in database:', Array.from(MOCK_API.USERS.keys()));
        
        if (!user) {
            console.log('❌ User not found');
            throw new Error('Invalid email or password');
        }
        
        if (user.password !== hashedPassword) {
            console.log('❌ Password mismatch');
            throw new Error('Invalid email or password');
        }
        
        console.log('✅ Login successful for user:', user.name);
        
        const token = generateToken(user.id);
        
        return {
            success: true,
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        };
    },
    
    // Get user data
    async getUserData(userId) {
        await this.delay();
        
        const userDataRecord = MOCK_API.USER_DATA.get(userId);
        if (!userDataRecord) {
            throw new Error('User data not found');
        }
        
        return {
            success: true,
            data: userDataRecord
        };
    },
    
    // Save user data
    async saveUserData(userId, data) {
        await this.delay();
        
        const userDataMap = MOCK_API.USER_DATA;
        const userDataRecord = userDataMap.get(userId) || { projects: [], flashcards: [] };
        
        // Ensure data isolation - only save data for the specific user
        userDataRecord.projects = (data.projects || []).filter(project => 
            project.userId === userId
        );
        userDataRecord.flashcards = data.flashcards || userDataRecord.flashcards;
        userDataRecord.lastSync = new Date().toISOString();
        
        userDataMap.set(userId, userDataRecord);
        MOCK_API.USER_DATA = userDataMap;
        
        console.log(`💾 Data saved for user ${userId}:`, {
            projects: userDataRecord.projects.length,
            flashcards: userDataRecord.flashcards.length
        });
        
        return {
            success: true,
            message: 'Data saved successfully'
        };
    },
    
    // Forgot password
    async forgotPassword(email) {
        await this.delay();
        
        const user = MOCK_API.USERS.get(email);
        if (!user) {
            throw new Error('No account found with this email');
        }
        
        // In a real app, you would send an email here
        console.log(`Password reset link would be sent to: ${email}`);
        
        return {
            success: true,
            message: 'Password reset link sent to your email'
        };
    },
    
    // Clear all mock data (for testing)
    clearAllData() {
        localStorage.removeItem('mock_users');
        localStorage.removeItem('mock_user_data');
        console.log('All mock data cleared');
    },
    
    // Get all registered users (for debugging)
    getAllUsers() {
        return Array.from(MOCK_API.USERS.values());
    },
    
    // API Key Management
    async saveUserApiKey(userId, apiKey) {
        await this.delay();
        
        // Find user by ID
        let user = null;
        for (const [email, userData] of MOCK_API.USERS) {
            if (userData.id === userId) {
                user = userData;
                break;
            }
        }
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Update user with API key
        const users = MOCK_API.USERS;
        users.set(user.email, {
            ...user,
            apiKey: apiKey
        });
        MOCK_API.USERS = users;
        
        console.log('✅ API key saved for user:', user.name);
        return { success: true };
    },
    
    async getUserApiKey(userId) {
        await this.delay();
        
        // Find user by ID
        for (const [email, userData] of MOCK_API.USERS) {
            if (userData.id === userId) {
                return {
                    success: true,
                    apiKey: userData.apiKey || null
                };
            }
        }
        
        throw new Error('User not found');
    },
    
    async removeUserApiKey(userId) {
        await this.delay();
        
        // Find user by ID
        let user = null;
        for (const [email, userData] of MOCK_API.USERS) {
            if (userData.id === userId) {
                user = userData;
                break;
            }
        }
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Remove API key from user
        const users = MOCK_API.USERS;
        users.set(user.email, {
            ...user,
            apiKey: null
        });
        MOCK_API.USERS = users;
        
        console.log('✅ API key removed for user:', user.name);
        return { success: true };
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, MockAPI, generateToken, parseToken };
} else {
    window.API_CONFIG = API_CONFIG;
    window.MockAPI = MockAPI;
    window.generateToken = generateToken;
    window.parseToken = parseToken;
    
    // Debug: Log that MockAPI is loaded
    console.log('🔧 MockAPI loaded successfully');
    console.log('📊 MockAPI methods:', Object.keys(MockAPI));
}
