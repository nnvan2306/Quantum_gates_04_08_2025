// postInteractions.js - Handles like, dislike, and comment functionality for posts

// API Base URL - Update this to your actual API URL
const API_BASE_URL = 'http://localhost:3001/api';

// Content type mapping
const CONTENT_TYPES = {
    'post': 'post',
    'event': 'post',  // Using post type for events
    'activity': 'post' // Using post type for activities
};

// Track user interactions in memory (in a real app, this would be managed by the backend)
const userInteractions = {
    // Format: 'post-type_id': { liked: boolean, disliked: boolean, comments: [] }
};

// Helper function for making API requests
async function makeApiRequest(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
        credentials: 'include' // For cookies if using httpOnly cookies
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Có lỗi xảy ra');
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        alert(`Lỗi: ${error.message || 'Có lỗi xảy ra khi kết nối đến máy chủ'}`);
        throw error;
    }
}

// Initialize interactions for a post if not already present
function initializePostInteractions(postId, postType = 'event') {
    const key = `${postType}_${postId}`;
    if (!userInteractions[key]) {
        userInteractions[key] = {
            liked: false,
            disliked: false,
            comments: [],
            likeCount: 0,
            dislikeCount: 0
        };
    }
    return userInteractions[key];
}

// Toggle like on a post
async function toggleLike(postId, postType = 'event') {
    try {
        const interactions = initializePostInteractions(postId, postType);
        const isLiking = !interactions.liked;
        
        // Update UI optimistically
        if (isLiking) {
            // If already disliked, remove dislike first
            if (interactions.disliked) {
                interactions.disliked = false;
                interactions.dislikeCount = Math.max(0, interactions.dislikeCount - 1);
            }
            interactions.liked = true;
            interactions.likeCount++;
        } else {
            interactions.liked = false;
            interactions.likeCount = Math.max(0, interactions.likeCount - 1);
        }
        
        updateLikeDislikeUI(postId, postType);
        
        // Call API to save the interaction
        const action = isLiking ? 'like' : 'unlike';
        await makeApiRequest(`/posts/${postId}/react`, 'POST', {
            type: action
        });
        
    } catch (error) {
        // Revert UI on error
        const interactions = initializePostInteractions(postId, postType);
        interactions.liked = !interactions.liked;
        interactions.likeCount += interactions.liked ? 1 : -1;
        updateLikeDislikeUI(postId, postType);
        
        console.error('Error toggling like:', error);
        alert('Không thể cập nhật lượt thích');
    }
}

// Toggle dislike on a post
async function toggleDislike(postId, postType = 'event') {
    try {
        const interactions = initializePostInteractions(postId, postType);
        const isDisliking = !interactions.disliked;
        
        // Update UI optimistically
        if (isDisliking) {
            // If already liked, remove like first
            if (interactions.liked) {
                interactions.liked = false;
                interactions.likeCount = Math.max(0, interactions.likeCount - 1);
            }
            interactions.disliked = true;
            interactions.dislikeCount++;
        } else {
            interactions.disliked = false;
            interactions.dislikeCount = Math.max(0, interactions.dislikeCount - 1);
        }
        
        updateLikeDislikeUI(postId, postType);
        
        // Call API to save the interaction
        const action = isDisliking ? 'dislike' : 'undislike';
        await makeApiRequest(`/posts/${postId}/react`, 'POST', {
            type: action
        });
        
    } catch (error) {
        // Revert UI on error
        const interactions = initializePostInteractions(postId, postType);
        interactions.disliked = !interactions.disliked;
        interactions.dislikeCount += interactions.disliked ? 1 : -1;
        updateLikeDislikeUI(postId, postType);
        
        console.error('Error toggling dislike:', error);
        alert('Không thể cập nhật lượt không thích');
    }
}

// Add a comment to a post
async function addComment(postId, postType = 'event', commentText) {
    const commentInput = document.getElementById(`comment-input-${postType}-${postId}`);
    
    // If commentText is not provided, try to get it from the input element
    if (commentText === undefined) {
        if (!commentInput) {
            console.error('Comment input element not found');
            return;
        }
        commentText = commentInput.value.trim();
    }
    
    if (!commentText) return;
    
    const interactions = initializePostInteractions(postId, postType);
    const tempId = 'temp-' + Date.now();
    
    // Add temporary comment
    const newComment = {
        id: tempId,
        text: commentText,
        timestamp: new Date().toISOString(),
        author: 'Bạn', // Will be replaced with actual username from server
        authorAvatar: null,
        isPending: true,
        status: 'pending'
    };
    
    // Add to beginning of comments array
    interactions.comments = [newComment, ...interactions.comments];
    
    // Clear input and update UI
    if (commentInput) {
        commentInput.disabled = true;
        commentInput.value = '';
    }
    
    // Make sure comments section is visible
    const commentsSection = document.getElementById(`comments-${postType}-${postId}`);
    if (commentsSection) {
        commentsSection.classList.remove('hidden');
    }
    
    // Show loading state
    updateCommentsUI(postId, postType);
    
    try {
        console.log('Sending comment to API...');
        // Call API to save the comment
        const response = await makeApiRequest(`/posts/${postId}/comments`, 'POST', {
            content: commentText,
            postType: postType
        });
        
        console.log('API Response:', response);
        
        // Replace the temporary comment with the actual one from the server
        const commentIndex = interactions.comments.findIndex(c => c.id === tempId);
        if (commentIndex !== -1) {
            interactions.comments[commentIndex] = {
                id: response.id || tempId,
                text: response.content || commentText,
                timestamp: response.created_at || new Date().toISOString(),
                author: response.username || response.author || 'Bạn',
                authorAvatar: response.user_avatar || response.authorAvatar,
                isPending: false,
                status: response.status || 'approved'
            };
            console.log('Updated comment:', interactions.comments[commentIndex]);
            updateCommentsUI(postId, postType);
        }
        
        // Reload comments to ensure we have the latest from the server
        await loadComments(postId, postType);
        
    } catch (error) {
        console.error('Error adding comment:', error);
        
        // Remove the temporary comment on error
        interactions.comments = interactions.comments.filter(c => c.id !== tempId);
        updateCommentsUI(postId, postType);
        
        // Show error and restore the comment text
        alert('Lỗi: Không thể đăng bình luận. ' + (error.message || ''));
        if (commentInput) {
            commentInput.value = commentText;
        }
    } finally {
        if (commentInput) {
            commentInput.disabled = false;
            commentInput.focus();
        }
    }
}

// Load comments for a post
async function loadComments(postId, postType = 'event') {
    try {
        const commentsContainer = document.getElementById(`comments-list-${postType}-${postId}`);
        if (commentsContainer) {
            commentsContainer.innerHTML = '<p class="text-sm text-gray-500 text-center py-2">Đang tải bình luận...</p>';
        }

        const response = await makeApiRequest(`/posts/${postId}/comments`);
        const interactions = initializePostInteractions(postId, postType);
        
        // Only update if we have new comments
        if (Array.isArray(response.data.comments)) {
            // Filter out any pending comments
            const pendingComments = interactions.comments.filter(c => c.isPending);
            
            // Map server comments to our format
            interactions.comments = [
                ...pendingComments,
                ...response.data.comments.map(comment => ({
                    id: comment.id,
                    text: comment.content || comment.text, // Handle both formats
                    timestamp: comment.created_at || comment.timestamp,
                    author: comment.username || comment.author || 'Người dùng',
                    authorAvatar: comment.user_avatar || comment.authorAvatar,
                    isPending: false,
                    status: comment.status || 'approved'
                }))
            ];
            
            updateCommentsUI(postId, postType);
            
            // If no comments and no pending comments, show a message
            if (interactions.comments.length === 0) {
                if (commentsContainer) {
                    commentsContainer.innerHTML = '<p class="text-sm text-gray-500 text-center py-2">Chưa có bình luận nào.</p>';
                }
            }
        } else {
            console.error('Invalid response format when loading comments:', response);
            if (commentsContainer) {
                commentsContainer.innerHTML = '<p class="text-sm text-red-500 text-center py-2">Không thể tải bình luận.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        const commentsContainer = document.getElementById(`comments-list-${postType}-${postId}`);
        if (commentsContainer) {
            commentsContainer.innerHTML = '<p class="text-sm text-red-500 text-center py-2">Lỗi khi tải bình luận. Vui lòng thử lại.</p>';
        }
    }
}

// Toggle comments section visibility
function toggleComments(postId, postType = 'event') {
    const commentsSection = document.getElementById(`comments-${postType}-${postId}`);
    if (commentsSection) {
        const isShowing = !commentsSection.classList.contains('hidden');
        
        if (!isShowing) {
            // If showing comments, load them
            commentsSection.classList.remove('hidden');
            // Force reload comments when showing the section
            loadComments(postId, postType);
        } else {
            // If hiding comments, just hide the section
            commentsSection.classList.add('hidden');
        }
        
        // Ensure the comments list container exists
        const commentsList = document.getElementById(`comments-list-${postType}-${postId}`);
        if (commentsList && commentsList.children.length === 0) {
            commentsList.innerHTML = '<p class="text-sm text-gray-500 text-center py-2">Đang tải bình luận...</p>';
        }
    }
}

// Update the like/dislike buttons UI
function updateLikeDislikeUI(postId, postType = 'event') {
    const interactions = initializePostInteractions(postId, postType);
    
    // Update like button
    const likeBtn = document.getElementById(`like-btn-${postType}-${postId}`);
    const likeCountEl = document.getElementById(`like-count-${postType}-${postId}`);
    
    if (likeBtn) {
        likeBtn.className = `flex items-center space-x-1 ${interactions.liked ? 'text-blue-600' : 'text-gray-500'}`;
        likeBtn.innerHTML = `
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
            <span>Thích</span>
        `;
    }
    
    if (likeCountEl) {
        likeCountEl.textContent = interactions.likeCount > 0 ? interactions.likeCount : '';
    }
    
    // Update dislike button
    const dislikeBtn = document.getElementById(`dislike-btn-${postType}-${postId}`);
    const dislikeCountEl = document.getElementById(`dislike-count-${postType}-${postId}`);
    
    if (dislikeBtn) {
        dislikeBtn.className = `flex items-center space-x-1 ${interactions.disliked ? 'text-red-600' : 'text-gray-500'}`;
        dislikeBtn.innerHTML = `
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" transform="rotate(180 10 10)" />
            </svg>
            <span>Không thích</span>
        `;
    }
    
    if (dislikeCountEl) {
        dislikeCountEl.textContent = interactions.dislikeCount > 0 ? interactions.dislikeCount : '';
    }
}

// Format a date to a relative time string (e.g., '2 phút trước')
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;
    
    if (diffInSeconds < minute) {
        return 'Vừa xong';
    } else if (diffInSeconds < hour) {
        const minutes = Math.floor(diffInSeconds / minute);
        return `${minutes} phút trước`;
    } else if (diffInSeconds < day) {
        const hours = Math.floor(diffInSeconds / hour);
        return `${hours} giờ trước`;
    } else if (diffInSeconds < month) {
        const days = Math.floor(diffInSeconds / day);
        return `${days} ngày trước`;
    } else if (diffInSeconds < year) {
        const months = Math.floor(diffInSeconds / month);
        return `${months} tháng trước`;
    } else {
        const years = Math.floor(diffInSeconds / year);
        return `${years} năm trước`;
    }
}

// Update the comments UI
function updateCommentsUI(postId, postType = 'event') {
    const interactions = initializePostInteractions(postId, postType);
    const commentsContainer = document.getElementById(`comments-list-${postType}-${postId}`);
    
    if (!commentsContainer) return;
    
    if (interactions.comments.length === 0) {
        commentsContainer.innerHTML = '<p class="text-sm text-gray-500 text-center py-2">Chưa có bình luận nào.</p>';
        return;
    }
    
    commentsContainer.innerHTML = interactions.comments
        .filter(comment => comment.status !== 'rejected') // Filter out rejected comments
        .map(comment => {
            const isPending = comment.isPending || comment.status === 'pending';
            const timeAgo = formatRelativeTime(comment.timestamp);
            
            return `
                <div class="bg-white border border-gray-100 p-4 rounded-lg mb-3 ${isPending ? 'opacity-75' : ''}">
                    <div class="flex items-start space-x-3">
                        ${comment.authorAvatar ? `
                            <img src="${comment.authorAvatar}" alt="${comment.author}" 
                                 class="w-8 h-8 rounded-full object-cover">
                        ` : `
                            <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                ${comment.author.charAt(0).toUpperCase()}
                            </div>
                        `}
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <span class="font-medium text-sm ${isPending ? 'text-gray-500' : 'text-gray-900'}">
                                        ${comment.author}
                                    </span>
                                    <span class="text-xs text-gray-500 ml-2">${timeAgo}</span>
                                </div>
                                ${isPending ? `
                                    <span class="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                                        Đang kiểm duyệt...
                                    </span>
                                ` : ''}
                            </div>
                            <p class="text-sm mt-1 text-gray-800 break-words">${comment.text}</p>
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');
}

// Create HTML for interaction controls
function createInteractionControls(postId, postType = 'event') {
    return `
        <div class="mt-4 pt-4 border-t border-gray-100">
            <!-- Like/Dislike Buttons -->
            <div class="flex items-center space-x-6 text-sm">
                <button id="like-btn-${postType}-${postId}" 
                        class="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
                        onclick="toggleLike('${postId}', '${postType}')">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Thích</span>
                    <span id="like-count-${postType}-${postId}" class="ml-1"></span>
                </button>
                
                <button id="dislike-btn-${postType}-${postId}" 
                        class="flex items-center space-x-1 text-gray-500 hover:text-red-600"
                        onclick="toggleDislike('${postId}', '${postType}')">
                    <svg class="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Không thích</span>
                    <span id="dislike-count-${postType}-${postId}" class="ml-1"></span>
                </button>
                
                <button class="flex items-center space-x-1 text-gray-500 hover:text-amber-600"
                        onclick="toggleComments('${postId}', '${postType}')">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span>Bình luận</span>
                </button>
            </div>
            
            <!-- Comments Section -->
            <div id="comments-${postType}-${postId}" class="mt-4 hidden">
                <!-- Comments List -->
                <div id="comments-list-${postType}-${postId}" class="mb-4 space-y-2 max-h-60 overflow-y-auto">
                    <!-- Comments will be loaded here -->
                </div>
                
                <!-- Add Comment Form -->
                <div class="flex space-x-2">
                    <input type="text" 
                           id="comment-input-${postType}-${postId}" 
                           class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                           placeholder="Viết bình luận...">
                    <button onclick="const input = document.getElementById('comment-input-${postType}-${postId}'); addComment('${postId}', '${postType}', input.value); input.value = '';" 
                            class="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
                        Gửi
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Make functions available globally
window.toggleLike = toggleLike;
window.toggleDislike = toggleDislike;
window.addComment = addComment;
window.toggleComments = toggleComments;
