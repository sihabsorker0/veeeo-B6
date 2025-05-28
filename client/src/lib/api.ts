// API helper functions
export async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth API
export const login = async (username: string, password: string) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to login");
  }
  
  return response.json();
};

export const register = async (userData: {
  username: string;
  password: string;
  email: string;
  avatarUrl?: string;
}) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
    credentials: "include",
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to register");
  }
  
  return response.json();
};

export const logout = async () => {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to logout");
  }
  
  return response.json();
};

// Video API
export const uploadVideo = async (formData: FormData) => {
  const response = await fetch("/api/videos", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  
  return response.json();
};

export const uploadThumbnail = async (formData: FormData) => {
  const response = await fetch("/api/upload/thumbnail", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  
  return response.json();
};

export const likeVideo = async (videoId: string, action: 'like' | 'dislike' | 'none') => {
  const response = await fetch(`/api/videos/${videoId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action }),
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to update like status');
  }
  return response.json();
};

export const addToWatchLater = async (videoId: string) => {
  const response = await fetch(`/api/videos/${videoId}/watch-later`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to add to watch later');
  }
  return response.json();
};

export const removeFromWatchLater = async (videoId: string) => {
  const response = await fetch(`/api/videos/${videoId}/watch-later`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to remove from watch later');
  }
  return response.json();
};

export const subscribeToChannel = async (channelId: string) => {
  const response = await fetch(`/api/users/${channelId}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to subscribe');
  }
  return response.json();
};

export const unsubscribeFromChannel = async (channelId: string) => {
  const response = await fetch(`/api/users/${channelId}/subscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to unsubscribe');
  }
  return response.json();
};

// Comments API
export const addComment = async (videoId: string, content: string) => {
  const response = await fetch(`/api/videos/${videoId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add comment');
  }
  
  return response.json();
};

export const deleteComment = async (commentId: string) => {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete comment');
  }
  
  return response.json();
};

export const likeComment = async (commentId: string) => {
  const response = await fetch(`/api/comments/${commentId}/like`, {
    method: 'POST',
    credentials: 'include'
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to like comment');
  }
  
  return response.json();
};

export const dislikeComment = async (commentId: string) => {
  const response = await fetch(`/api/comments/${commentId}/dislike`, {
    method: 'POST',
    credentials: 'include'
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to dislike comment');
  }
  
  return response.json();
};

export const replyToComment = async (commentId: string, content: string) => {
  const response = await fetch(`/api/comments/${commentId}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add reply');
  }
  
  return response.json();
};

// History API
export const clearWatchHistory = async () => {
  const response = await apiRequest("DELETE", `/api/history`);
  return response.json();
};