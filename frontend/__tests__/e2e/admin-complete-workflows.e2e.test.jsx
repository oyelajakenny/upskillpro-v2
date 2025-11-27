/**
 * Complete Admin Workflows End-to-End Tests
 * 
 * This test suite validates complete admin user journeys from start to finish,
 * including authentication, navigation, operations, and data consistency.
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock API client
const mockApi = {
  auth: {
    login: jest.fn(),
    verifyToken: jest.fn(),
    logout: jest.fn(),
  },
  admin: {
    getDashboard: jest.fn(),
    getUsers: jest.fn(),
    updateUser: jest.fn(),
    getCourses: 