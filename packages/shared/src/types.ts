import { Role, TicketPriority, TicketStatus } from './enums';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface TicketDto {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer: UserDto;
  assignedTo: UserDto | null;
  category: CategoryDto;
  tags: TagDto[];
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  color: string;
  slug: string;
}

export interface TagDto {
  id: string;
  name: string;
  color: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: {
    statusCode: number;
    message: string;
    details?: unknown;
  };
}
