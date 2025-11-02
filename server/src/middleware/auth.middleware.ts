import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse } from '../types';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'No token provided'
      };
      return res.status(401).json(response);
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid or expired token'
      };
      return res.status(401).json(response);
    }

    req.userId = user.id;
    next();
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Authentication failed'
    };
    res.status(401).json(response);
  }
};