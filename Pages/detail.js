class BeautifulBlogDetail {
    constructor() {
        this.apiUrl = "http://localhost:3001/api/posts";
        this.elements = this.initElements();
        this.postId = this.getPostId();
    }

    initElements() {
        return {
            loading: document.getElementById("loading"),
            error: document.getElementById("error"),
            errorMessage: document.getElementById("error-message"),
            post: document.getElementById("post"),

            // Hero elements
            category: document.getElementById("category"),
            title: document.getElementById("title"),
            excerpt: document.getElementById("excerpt"),
            views: document.getElementById("views"),
            likes: document.getElementById("likes"),
            comments: document.getElementById("comments"),

            // Author elements
            authorInitial: document.getElementById("author-initial"),
            authorName: document.getElementById("author-name"),
            authorUsername: document.getElementById("author-username"),

            // Date elements
            publishedDate: document.getElementById("published-date"),
            updatedDate: document.getElementById("updated-date"),
            createdDate: document.getElementById("created-date"),

            // Content
            content: document.getElementById("content"),

            // Meta elements
            tags: document.getElementById("tags"),
            postId: document.getElementById("post-id"),
            status: document.getElementById("status"),
            postType: document.getElementById("post-type"),
        };
    }

    getPostId() {
        const params = new URLSearchParams(window.location.search);
        return params.get("id");
    }

    formatDate(dateString, format = "full") {
        const date = new Date(dateString);
        const options = {
            full: {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            },
            short: {
                year: "numeric",
                month: "short",
                day: "numeric",
            },
            relative: {
                year: "numeric",
                month: "short",
                day: "numeric",
            },
        };

        return date.toLocaleDateString("vi-VN", options[format]);
    }

    getAuthorInitials(name) {
        if (!name) return "U";
        const words = name.trim().split(" ");
        if (words.length >= 2) {
            return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return num.toString();
    }

    showState(state) {
        const states = ["loading", "error", "post"];
        states.forEach((s) => {
            this.elements[s].style.display = s === state ? "block" : "none";
        });
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.showState("error");
    }

    createTags(tags) {
        if (!tags || tags.length === 0) {
            return '<span class="tag">Không có tag</span>';
        }
        return tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
    }

    getStatusColor(status) {
        const colors = {
            published: "var(--success)",
            draft: "var(--warning)",
            private: "var(--error)",
            pending: "var(--accent)",
        };
        return colors[status] || "var(--text-muted)";
    }

    populatePost(post) {
        // Update page title
        document.title = `${post.title} - Beautiful Blog`;

        // Hero section
        this.elements.category.textContent = post.category || "Uncategorized";
        this.elements.title.textContent = post.title || "Untitled";
        this.elements.excerpt.textContent =
            post.excerpt || "No description available";

        // Stats
        this.elements.views.textContent = this.formatNumber(
            post.view_count || 0
        );
        this.elements.likes.textContent = this.formatNumber(
            post.like_count || 0
        );
        this.elements.comments.textContent = this.formatNumber(
            post.comment_count || 0
        );

        // Author
        this.elements.authorInitial.textContent = this.getAuthorInitials(
            post.author_name
        );
        this.elements.authorName.textContent = post.author_name || "Anonymous";
        this.elements.authorUsername.textContent = `@${post.author_username || "unknown"
            }`;

        // Dates
        if (post.published_at) {
            this.elements.publishedDate.textContent = this.formatDate(
                post.published_at,
                "short"
            );
        }

        if (post.updated_at) {
            const updatedText = `Cập nhật: ${this.formatDate(
                post.updated_at,
                "short"
            )}`;
            this.elements.updatedDate.textContent = updatedText;
        }

        if (post.created_at) {
            this.elements.createdDate.textContent = this.formatDate(
                post.created_at
            );
        }

        // Content
        const formattedContent = (post.content || "No content available")
            .replace(/\n\n/g, "</p><p>")
            .replace(/\n/g, "<br>");
        this.elements.content.innerHTML = `<p>${formattedContent}</p>`;

        // Tags
        this.elements.tags.innerHTML = this.createTags(post.tags);

        // Meta
        this.elements.postId.textContent = post.id || "N/A";
        this.elements.status.textContent = post.status || "unknown";
        this.elements.status.style.backgroundColor = this.getStatusColor(
            post.status
        );
        this.elements.postType.textContent = post.post_type || "post";

        // Show post with animation
        this.showState("post");

        // Add scroll animations
        this.addScrollAnimations();
    }

    addScrollAnimations() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = "1";
                        entry.target.style.transform = "translateY(0)";
                    }
                });
            },
            { threshold: 0.1 }
        );

        // Animate sections on scroll
        const sections = [
            ".author-section",
            ".content-section",
            ".meta-section",
        ];
        sections.forEach((selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.opacity = "0";
                element.style.transform = "translateY(30px)";
                element.style.transition = "all 0.6s ease-out";
                observer.observe(element);
            }
        });
    }

    async fetchPost() {
        try {
            this.showState("loading");

            const response = await fetch(`${this.apiUrl}/${this.postId}`);

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();

            if (!data.success || !data.data?.post) {
                throw new Error("Invalid response format");
            }

            this.populatePost(data.data.post);
        } catch (error) {
            console.error("Error fetching post:", error);
            this.showError(`Không thể tải bài viết: ${error.message}`);
        }
    }

    init() {
        if (!this.postId) {
            this.showError("Không tìm thấy ID bài viết trong URL");
            return;
        }

        this.fetchPost();
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const blog = new BeautifulBlogDetail();
    blog.init();
});

// Add some extra visual effects
document.addEventListener("DOMContentLoaded", () => {
    // Smooth scroll for any internal links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    // Add parallax effect to hero background
    window.addEventListener("scroll", () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector(".hero-background");
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const likeBtn = document.getElementById("button-like");
    const likeCountEl = document.getElementById("like-count");
    const postId = new URLSearchParams(window.location.search).get("id");
    const token = localStorage.getItem("quantum_gates_token"); // nếu có JWT

    if (!postId) return;

    const setButtonUI = (liked, like_count) => {
        likeBtn.textContent = liked ? "💔 Bỏ thích" : "❤️ Thích";
        likeBtn.classList.toggle("liked", liked);
        if (likeCountEl) likeCountEl.textContent = like_count ?? "";
    };

    const loadLikeStatus = async () => {
        try {
            const res = await fetch(
                `http://localhost:3001/api/posts/check/${postId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                }
            );
            const data = await res.json();
            if (data.success) {
                setButtonUI(data.data.liked, data.data.like_count);
            } else {
                console.warn("Không lấy được trạng thái like:", data.message);
            }
        } catch (err) {
            console.error("Lỗi khi kiểm tra like:", err);
        }
    };

    loadLikeStatus();
});

document.addEventListener("DOMContentLoaded", () => {
    const likeBtn = document.getElementById("button-like");
    likeBtn.addEventListener("click", () => {
        console.log("runnnnn");
        const postId = new URLSearchParams(window.location.search).get("id");
        const token = localStorage.getItem("token"); // bạn cần đảm bảo token đã được lưu
        fetch(`http://localhost:3001/api/posts/like/${postId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`, // nếu dùng JWT
            },
        })
            .then((res) => res.json())
            .then((result) => {
                if (result.success) {
                    const { liked, like_count } = result.data;

                    // cập nhật giao diện
                    const likeText = liked ? "💔 Bỏ thích" : "❤️ Thích";
                    likeBtn.textContent = likeText;
                    likeBtn.classList.toggle("liked", liked);
                    document.getElementById("like-count").textContent =
                        like_count;
                } else {
                    alert("Không thể thực hiện thao tác thích.");
                }
            });
        // .catch((err) => {
        //     console.error("Lỗi like:", err);
        //     alert("Có lỗi xảy ra khi thích bài viết.");
        // });
    });
});
