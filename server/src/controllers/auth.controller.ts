import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse, User, AuthResponse } from '../types';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        const response: ApiResponse<never> = {
          success: false,
          error: error.message
        };
        return res.status(400).json(response);
      }

      if (!data.user) {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Registration failed'
        };
        return res.status(400).json(response);
      }

      const response: ApiResponse<User> = {
        success: true,
        data: {
          id: data.user.id,
          email: data.user.email || ''
        }
      };
      res.json(response);
    } catch (error) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        const response: ApiResponse<never> = {
          success: false,
          error: error.message
        };
        return res.status(401).json(response);
      }

      if (!data.user || !data.session) {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Authentication failed'
        };
        return res.status(401).json(response);
      }

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email || ''
          },
          token: data.session.access_token
        }
      };
      res.json(response);
    } catch (error) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        const response: ApiResponse<never> = {
          success: false,
          error: error.message
        };
        return res.status(400).json(response);
      }

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Logged out successfully' }
      };
      res.json(response);
    } catch (error) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Internal server error'
      };
      res.status(500).json(response);
    }
  }
}