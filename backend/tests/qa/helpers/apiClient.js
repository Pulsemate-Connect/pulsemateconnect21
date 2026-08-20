/**
 * API Client Helper
 * Wrapper around supertest for API testing
 */

const request = require('supertest');
const config = require('../config/test.config');

class APIClient {
  constructor(baseURL = config.env.baseURL) {
    this.baseURL = baseURL;
    this.tokens = {
      admin: null,
      clinics: new Map(), // clinicId => token
      doctors: new Map(), // doctorId => token
    };
  }

  /**
   * Make authenticated request
   */
  request() {
    return request(this.baseURL);
  }

  /**
   * Set authentication token
   */
  setToken(role, id, token) {
    if (role === 'admin') {
      this.tokens.admin = token;
    } else if (role === 'clinic') {
      this.tokens.clinics.set(id, token);
    } else if (role === 'doctor') {
      this.tokens.doctors.set(id, token);
    }
  }

  /**
   * Get authentication token
   */
  getToken(role, id = null) {
    if (role === 'admin') {
      return this.tokens.admin;
    } else if (role === 'clinic' && id) {
      return this.tokens.clinics.get(id);
    } else if (role === 'doctor' && id) {
      return this.tokens.doctors.get(id);
    }
    return null;
  }

  /**
   * Make authenticated GET request
   */
  async get(url, role = null, id = null) {
    const req = this.request().get(url);
    
    const token = this.getToken(role, id);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }

  /**
   * Make authenticated POST request
   */
  async post(url, data, role = null, id = null) {
    const req = this.request().post(url).send(data);
    
    const token = this.getToken(role, id);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }

  /**
   * Make authenticated PUT request
   */
  async put(url, data, role = null, id = null) {
    const req = this.request().put(url).send(data);
    
    const token = this.getToken(role, id);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }

  /**
   * Make authenticated PATCH request
   */
  async patch(url, data, role = null, id = null) {
    const req = this.request().patch(url).send(data);
    
    const token = this.getToken(role, id);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }

  /**
   * Make authenticated DELETE request
   */
  async delete(url, role = null, id = null) {
    const req = this.request().delete(url);
    
    const token = this.getToken(role, id);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }

  /**
   * Upload file
   */
  async uploadFile(url, fieldName, filePath, role = null, id = null) {
    const req = this.request()
      .post(url)
      .attach(fieldName, filePath);
    
    const token = this.getToken(role, id);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }

  /**
   * Clear all tokens
   */
  clearTokens() {
    this.tokens.admin = null;
    this.tokens.clinics.clear();
    this.tokens.doctors.clear();
  }
}

module.exports = APIClient;
